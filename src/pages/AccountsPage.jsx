import React, { useState, useEffect } from 'react';
import { Plus, Settings2, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { AddAccountDialog } from '@/components/dashboard/AddAccountDialog';
import { EditAccountDialog } from '@/components/dashboard/EditAccountDialog';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      // Fetches from Java Backend: GET /api/accounts
      const data = await api.get('/accounts');
      setAccounts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load AWS accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    
    try {
      // Calls Java Backend: DELETE /api/accounts/{id}
      await api.delete(`/accounts/${id}`);
      toast({ title: "Success", description: "Account disconnected successfully" });
      fetchAccounts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AWS Accounts</h1>
          <p className="text-muted-foreground">
            Manage your connected cloud environments and credentials.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Environments</CardTitle>
          <CardDescription>
            Your cost data is aggregated from these accounts using read-only access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading accounts...
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No accounts connected yet.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.account_name}</TableCell>
                    <TableCell className="font-mono text-xs">{account.account_id}</TableCell>
                    <TableCell>{account.region || 'us-east-1'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddAccountDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        onSuccess={fetchAccounts} 
      />
      
      <EditAccountDialog 
        account={selectedAccount}
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        onSuccess={fetchAccounts} 
      />
    </div>
  );
}