import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function EditAccountDialog({ account, open, onOpenChange, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountName: '',
    awsEmail: '',
    accountId: '',
    region: 'us-east-1',
    accessKeyId: '',
    secretKey: '',
  });
  const { toast } = useToast();

  // Populate form when the account prop changes
  useEffect(() => {
    if (account) {
      setFormData({
        accountName: account.account_name || '',
        awsEmail: account.aws_email || '',
        accountId: account.account_id || '',
        region: account.region || 'us-east-1',
        // We don't populate secrets for security, only allow overwriting
        accessKeyId: '',
        secretKey: '',
      });
    }
  }, [account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send update to Backend: PUT /api/accounts/{id}
      await api.put(`/accounts/${account.id}`, {
        account_name: formData.accountName,
        aws_email: formData.awsEmail,
        account_id: formData.accountId,
        region: formData.region,
        // Only send keys if the user typed something new
        ...(formData.accessKeyId && { access_key_id: formData.accessKeyId }),
        ...(formData.secretKey && { secret_access_key: formData.secretKey }),
      });

      toast({ title: 'Account updated successfully' });
      onSuccess(); // Refresh the list
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit AWS Account</DialogTitle>
          <DialogDescription>
            Update connection details for {formData.accountName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Account Name</Label>
            <Input
              id="edit-name"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-region">Region</Label>
            <Input
              id="edit-region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2 border-t pt-4 mt-4">
            <Label className="text-muted-foreground">Update Credentials (Optional)</Label>
            <Input
              placeholder="New Access Key ID"
              value={formData.accessKeyId}
              onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
            />
            <Input
              type="password"
              placeholder="New Secret Access Key"
              value={formData.secretKey}
              onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}