import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AWSAccount } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EditAccountDialogProps {
  account: AWSAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditAccountDialog({ account, open, onOpenChange, onSuccess }: EditAccountDialogProps) {
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
    isActive: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (account) {
      setFormData({
        accountName: account.account_name,
        awsEmail: account.aws_email,
        accountId: account.account_id || '',
        region: account.region,
        iamRoleArn: account.iam_role_arn || '',
        accessKeyId: '',
        secretKey: '',
        isActive: account.is_active,
      });
      setConnectionType(account.connection_type);
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setLoading(true);

    try {
      const accountData: any = {
        account_name: formData.accountName,
        aws_email: formData.awsEmail,
        account_id: formData.accountId || null,
        connection_type: connectionType,
        region: formData.region,
        is_active: formData.isActive,
        updated_at: new Date().toISOString(),
      };

      // Only update credentials if they're provided
      if (connectionType === 'iam_role' && formData.iamRoleArn) {
        accountData.iam_role_arn = formData.iamRoleArn;
      }
      if (connectionType === 'access_key') {
        if (formData.accessKeyId) {
          accountData.access_key_id_encrypted = formData.accessKeyId;
        }
        if (formData.secretKey) {
          accountData.secret_key_encrypted = formData.secretKey;
        }
      }

      const { error } = await supabase
        .from('aws_accounts')
        .update(accountData)
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: 'Account updated successfully',
        description: 'Your AWS account information has been updated',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Failed to update account',
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
          <DialogTitle>Edit AWS Account</DialogTitle>
          <DialogDescription>
            Update your AWS account information and credentials
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Account is active</Label>
            </div>

            <Tabs value={connectionType} onValueChange={(v) => setConnectionType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="iam_role">IAM Role</TabsTrigger>
                <TabsTrigger value="access_key">Access Keys</TabsTrigger>
              </TabsList>

              <TabsContent value="iam_role" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="iamRoleArn">IAM Role ARN</Label>
                  <Input
                    id="iamRoleArn"
                    placeholder="arn:aws:iam::123456789012:role/CostOptimizerRole"
                    value={formData.iamRoleArn}
                    onChange={(e) => setFormData({ ...formData, iamRoleArn: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to keep existing credentials
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="access_key" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessKeyId">Access Key ID</Label>
                  <Input
                    id="accessKeyId"
                    placeholder="Leave blank to keep existing"
                    value={formData.accessKeyId}
                    onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Access Key</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="Leave blank to keep existing"
                    value={formData.secretKey}
                    onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
