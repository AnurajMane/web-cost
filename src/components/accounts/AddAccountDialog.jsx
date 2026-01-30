import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function AddAccountDialog({ open, onOpenChange, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/accounts', { account_name: name, account_id: accountId });
      toast({ title: "Account Connected" });
      onSuccess();
      onOpenChange(false);
      setName('');
      setAccountId('');
    } catch (error) {
      toast({ title: "Failed to connect", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect AWS Account</DialogTitle>
          <DialogDescription>Enter your account details to start tracking.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Account Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production" required />
          </div>
          <div className="space-y-2">
            <Label>AWS Account ID</Label>
            <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="123456789012" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}