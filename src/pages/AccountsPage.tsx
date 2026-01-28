import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AWSAccount } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Cloud, CheckCircle2, XCircle, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { AddAccountDialog } from '@/components/accounts/AddAccountDialog';
import { EditAccountDialog } from '@/components/accounts/EditAccountDialog';
import { useToast } from '@/hooks/use-toast';
import { FunctionsHttpError } from '@supabase/supabase-js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function AccountsPage() {
  const [accounts, setAccounts] = useState<AWSAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AWSAccount | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<AWSAccount | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from('aws_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading accounts',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  const handleAccountAdded = () => {
    loadAccounts();
    setDialogOpen(false);
  };

  const handleAccountUpdated = () => {
    loadAccounts();
    setEditDialogOpen(false);
    setSelectedAccount(null);
  };

  const handleEditAccount = (account: AWSAccount) => {
    setSelectedAccount(account);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (account: AWSAccount) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    try {
      const { error } = await supabase
        .from('aws_accounts')
        .delete()
        .eq('id', accountToDelete.id);

      if (error) throw error;

      toast({
        title: 'Account deleted',
        description: 'AWS account has been removed successfully',
      });

      loadAccounts();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    setSyncing(accountId);
    try {
      const { data, error } = await supabase.functions.invoke('sync-aws-costs', {
        body: { accountId },
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
          } catch {
            errorMessage = `${error.message || 'Failed to read response'}`;
          }
        }
        throw new Error(errorMessage);
      }

      toast({
        title: 'Sync completed',
        description: data.message || `Synced ${data.recordsCount} cost records`,
      });

      loadAccounts();
    } catch (error: any) {
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AWS Accounts</h2>
          <p className="text-muted-foreground">Manage your connected AWS accounts</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cloud className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No AWS accounts connected</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Connect your first AWS account to start tracking costs and getting AI-powered recommendations
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-primary p-2 rounded-lg">
                      <Cloud className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.account_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{account.aws_email}</p>
                    </div>
                  </div>
                  {account.is_active ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{account.connection_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Region:</span>
                  <span className="font-medium">{account.region}</span>
                </div>
                {account.account_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account ID:</span>
                    <span className="font-medium font-mono">{account.account_id}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={account.is_active ? 'text-success' : 'text-destructive'}>
                    {account.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {account.last_sync_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Sync:</span>
                    <span className="font-medium">
                      {new Date(account.last_sync_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="space-y-2 mt-4">
                  <Button
                    onClick={() => handleSyncAccount(account.id)}
                    disabled={syncing === account.id}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing === account.id ? 'animate-spin' : ''}`} />
                    {syncing === account.id ? 'Syncing...' : 'Sync Cost Data'}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditAccount(account)}
                      className="flex-1 gap-2"
                      variant="secondary"
                      size="sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(account)}
                      className="flex-1 gap-2"
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleAccountAdded} />
      <EditAccountDialog
        account={selectedAccount}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleAccountUpdated}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the AWS account "{accountToDelete?.account_name}" and all associated cost data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}