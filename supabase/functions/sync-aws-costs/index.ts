import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// AWS SDK v3 imports for Deno
import { STSClient, AssumeRoleCommand } from 'npm:@aws-sdk/client-sts@3.511.0';
import { CostExplorerClient, GetCostAndUsageCommand } from 'npm:@aws-sdk/client-cost-explorer@3.511.0';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { accountId } = await req.json();

    // Fetch AWS account details
    const { data: awsAccount, error: accountError } = await supabaseAdmin
      .from('aws_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !awsAccount) {
      throw new Error('AWS account not found');
    }

    console.log('Fetching costs for account:', awsAccount.account_name);

    // For IAM Role authentication
    if (awsAccount.connection_type === 'iam_role' && awsAccount.iam_role_arn) {
      const roleArn = awsAccount.iam_role_arn;
      
      // Check if AWS credentials are configured in environment
      const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
      const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
      
      if (!awsAccessKeyId || !awsSecretAccessKey) {
        throw new Error('AWS credentials not configured in environment. Please configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Edge Function secrets.');
      }

      // Assume the IAM role
      const stsClient = new STSClient({
        region: awsAccount.region || 'us-east-1',
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
      });

      const assumeRoleCommand = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: 'CostOptimizerSession',
        DurationSeconds: 3600,
      });

      console.log('Assuming role:', roleArn);
      const assumeRoleResponse = await stsClient.send(assumeRoleCommand);

      if (!assumeRoleResponse.Credentials) {
        throw new Error('Failed to assume IAM role');
      }

      // Use temporary credentials to access Cost Explorer
      const costExplorerClient = new CostExplorerClient({
        region: awsAccount.region || 'us-east-1',
        credentials: {
          accessKeyId: assumeRoleResponse.Credentials.AccessKeyId!,
          secretAccessKey: assumeRoleResponse.Credentials.SecretAccessKey!,
          sessionToken: assumeRoleResponse.Credentials.SessionToken!,
        },
      });

      // Get cost data for the last 12 months (all available data)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      const costCommand = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: endDate.toISOString().split('T')[0],
        },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost', 'UsageQuantity'],
        GroupBy: [
          { Type: 'DIMENSION', Key: 'SERVICE' },
          { Type: 'DIMENSION', Key: 'REGION' },
        ],
      });

      console.log('Fetching cost data from AWS Cost Explorer (last 12 months)...');
      const costResponse = await costExplorerClient.send(costCommand);

      // Process and store cost data
      const costRecords = [];
      
      if (costResponse.ResultsByTime) {
        for (const result of costResponse.ResultsByTime) {
          const recordDate = result.TimePeriod?.Start || '';
          
          if (result.Groups) {
            for (const group of result.Groups) {
              const serviceName = group.Keys?.[0] || 'Unknown';
              const region = group.Keys?.[1] || 'global';
              const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
              const usage = parseFloat(group.Metrics?.UsageQuantity?.Amount || '0');
              const usageUnit = group.Metrics?.UsageQuantity?.Unit || '';

              if (cost > 0) {
                costRecords.push({
                  aws_account_id: accountId,
                  service_name: serviceName,
                  region: region,
                  cost_amount: cost,
                  usage_quantity: usage,
                  usage_unit: usageUnit,
                  record_date: recordDate,
                });
              }
            }
          }
        }
      }

      console.log(`Inserting ${costRecords.length} cost records...`);

      // Delete existing records for this account to avoid duplicates
      await supabaseAdmin
        .from('cost_data')
        .delete()
        .eq('aws_account_id', accountId);

      // Insert new cost data
      if (costRecords.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('cost_data')
          .insert(costRecords);

        if (insertError) {
          console.error('Error inserting cost data:', insertError);
          throw insertError;
        }
      }

      // Update last sync time
      await supabaseAdmin
        .from('aws_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', accountId);

      return new Response(
        JSON.stringify({
          success: true,
          recordsCount: costRecords.length,
          message: `Successfully synced ${costRecords.length} cost records`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (awsAccount.connection_type === 'access_key') {
      // For Access Key authentication
      if (!awsAccount.access_key_id_encrypted || !awsAccount.secret_key_encrypted) {
        throw new Error('Access key credentials not found for this account');
      }

      console.log('Using access key authentication for:', awsAccount.account_name);

      // Use stored access keys directly
      const costExplorerClient = new CostExplorerClient({
        region: awsAccount.region || 'us-east-1',
        credentials: {
          accessKeyId: awsAccount.access_key_id_encrypted,
          secretAccessKey: awsAccount.secret_key_encrypted,
        },
      });

      // Get cost data for the last 12 months (all available data)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      const costCommand = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: endDate.toISOString().split('T')[0],
        },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost', 'UsageQuantity'],
        GroupBy: [
          { Type: 'DIMENSION', Key: 'SERVICE' },
          { Type: 'DIMENSION', Key: 'REGION' },
        ],
      });

      console.log('Fetching cost data from AWS Cost Explorer (last 12 months)...');
      const costResponse = await costExplorerClient.send(costCommand);

      // Process and store cost data
      const costRecords = [];
      
      if (costResponse.ResultsByTime) {
        for (const result of costResponse.ResultsByTime) {
          const recordDate = result.TimePeriod?.Start || '';
          
          if (result.Groups) {
            for (const group of result.Groups) {
              const serviceName = group.Keys?.[0] || 'Unknown';
              const region = group.Keys?.[1] || 'global';
              const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
              const usage = parseFloat(group.Metrics?.UsageQuantity?.Amount || '0');
              const usageUnit = group.Metrics?.UsageQuantity?.Unit || '';

              if (cost > 0) {
                costRecords.push({
                  aws_account_id: accountId,
                  service_name: serviceName,
                  region: region,
                  cost_amount: cost,
                  usage_quantity: usage,
                  usage_unit: usageUnit,
                  record_date: recordDate,
                });
              }
            }
          }
        }
      }

      console.log(`Inserting ${costRecords.length} cost records...`);

      // Delete existing records for this account to avoid duplicates
      await supabaseAdmin
        .from('cost_data')
        .delete()
        .eq('aws_account_id', accountId);

      // Insert new cost data
      if (costRecords.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('cost_data')
          .insert(costRecords);

        if (insertError) {
          console.error('Error inserting cost data:', insertError);
          throw insertError;
        }
      }

      // Update last sync time
      await supabaseAdmin
        .from('aws_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', accountId);

      return new Response(
        JSON.stringify({
          success: true,
          recordsCount: costRecords.length,
          message: `Successfully synced ${costRecords.length} cost records`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      throw new Error('Invalid connection type');
    }
  } catch (error: any) {
    console.error('Error syncing AWS costs:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to sync AWS costs' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
