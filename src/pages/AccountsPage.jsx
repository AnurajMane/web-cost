import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { AddAccountDialog } from '@/components/accounts/AddAccountDialog';
import { EditAccountDialog } from '@/components/accounts/EditAccountDialog';

export function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
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

  const handleSync = async (id) => {
    try {
      toast({ title: 'Sync started...' });
      await api.post(`/accounts/${id}/sync`);
      toast({ title: 'Sync completed' });
    } catch (error) {
      toast({ title: 'Sync failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      await api.delete(`/accounts/${id}`);
      setAccounts(accounts.filter(a => a.id !== id));
      toast({ title: 'Account deleted' });
    } catch (error) {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AWS Accounts</h2>
          <p className="text-muted-foreground">Manage your connected AWS accounts</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Connect Account
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-48">
            <p className="text-muted-foreground mb-4">No accounts connected yet.</p>
            <Button variant="outline" onClick={() => setAddDialogOpen(true)}>Connect your first account</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="relative group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="truncate">{account.account_name}</span>
                  <div className={`h-2 w-2 rounded-full ${account.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="truncate">ID: {account.account_id}</p>
                    <p>Region: {account.region}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleSync(account.id)}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Sync
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        setSelectedAccount(account);
                        setEditDialogOpen(true);
                    }}>
                        Edit
                    </Button>
                    <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => handleDelete(account.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddAccountDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onSuccess={loadAccounts} 
      />
      
      <EditAccountDialog
        account={selectedAccount}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={loadAccounts}
      />
    </div>
  );
}