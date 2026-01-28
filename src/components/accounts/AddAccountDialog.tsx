import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddAccountDialog({ open, onOpenChange, onSuccess }: AddAccountDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connectionType, setConnectionType] = useState<'iam_role' | 'access_key'>('iam_role');
  const [formData, setFormData] = useState({
    accountName: '',
    awsEmail: '',
    accountId: '',
    region: 'us-east-1',
    iamRoleArn: '',
    accessKeyId: '',
    secretKey: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check for duplicate accounts by AWS email or account ID
      const { data: existingAccounts, error: checkError } = await supabase
        .from('aws_accounts')
        .select('id, aws_email, account_id')
        .eq('user_id', user!.id)
        .or(`aws_email.eq.${formData.awsEmail}${formData.accountId ? `,account_id.eq.${formData.accountId}` : ''}`);

      if (checkError) throw checkError;

      if (existingAccounts && existingAccounts.length > 0) {
        const duplicate = existingAccounts[0];
        const duplicateBy = duplicate.aws_email === formData.awsEmail ? 'email' : 'account ID';
        throw new Error(`Account already exists with this ${duplicateBy}`);
      }

      const accountData = {
        user_id: user!.id,
        account_name: formData.accountName,
        aws_email: formData.awsEmail,
        account_id: formData.accountId || null,
        connection_type: connectionType,
        region: formData.region,
        iam_role_arn: connectionType === 'iam_role' ? formData.iamRoleArn : null,
        access_key_id_encrypted: connectionType === 'access_key' ? formData.accessKeyId : null,
        secret_key_encrypted: connectionType === 'access_key' ? formData.secretKey : null,
        is_active: true,
      };

      const { error } = await supabase.from('aws_accounts').insert([accountData]);

      if (error) throw error;

      toast({
        title: 'Account added successfully',
        description: 'Your AWS account has been connected',
      });

      setFormData({
        accountName: '',
        awsEmail: '',
        accountId: '',
        region: 'us-east-1',
        iamRoleArn: '',
        accessKeyId: '',
        secretKey: '',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Failed to add account',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add AWS Account</DialogTitle>
          <DialogDescription>
            Connect your AWS account to start tracking costs and getting recommendations
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                placeholder="Production Account"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="awsEmail">AWS Email ID *</Label>
              <Input
                id="awsEmail"
                type="email"
                placeholder="aws-admin@company.com"
                value={formData.awsEmail}
                onChange={(e) => setFormData({ ...formData, awsEmail: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Email associated with your AWS account</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">AWS Account ID (Optional)</Label>
              <Input
                id="accountId"
                placeholder="123456789012"
                maxLength={12}
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Default Region *</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs value={connectionType} onValueChange={(v) => setConnectionType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="iam_role">IAM Role</TabsTrigger>
                <TabsTrigger value="access_key">Access Keys</TabsTrigger>
              </TabsList>

              <TabsContent value="iam_role" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="iamRoleArn">IAM Role ARN *</Label>
                  <Input
                    id="iamRoleArn"
                    placeholder="arn:aws:iam::123456789012:role/CostOptimizerRole"
                    value={formData.iamRoleArn}
                    onChange={(e) => setFormData({ ...formData, iamRoleArn: e.target.value })}
                    required={connectionType === 'iam_role'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: More secure than access keys. Leave empty for now if not configured.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="access_key" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessKeyId">Access Key ID *</Label>
                  <Input
                    id="accessKeyId"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={formData.accessKeyId}
                    onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
                    required={connectionType === 'access_key'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Access Key *</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    value={formData.secretKey}
                    onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                    required={connectionType === 'access_key'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for now. Keys will be configured later in Settings.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}