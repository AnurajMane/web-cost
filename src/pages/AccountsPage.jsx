import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, RefreshCw, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

// You will create these dialogs later in src/components/accounts/
import { AddAccountDialog } from '@/components/accounts/AddAccountDialog';
import { EditAccountDialog } from '@/components/accounts/EditAccountDialog';

export function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await api.get('/accounts');
      setAccounts(data);
    } catch (error) {
      toast({ title: 'Error loading accounts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Are you sure?")) return;
    try {
      await api.delete(`/accounts/${id}`);
      setAccounts(accounts.filter(a => a.id !== id));
      toast({ title: 'Account deleted' });
    } catch (error) {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">AWS Accounts</h2>
          <p className="text-muted-foreground">Manage your connected AWS accounts</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Connect Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-base">
                {account.account_name}
                <div className={`h-2 w-2 rounded-full ${account.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground truncate">ID: {account.account_id}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(account.id)}>
                   <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddAccountDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={loadAccounts} 
      />
      {/* Add EditAccountDialog here if needed */}
    </div>
  );
}