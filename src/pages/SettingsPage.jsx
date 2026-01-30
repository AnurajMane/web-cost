import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info, CheckCircle2, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const [config, setConfig] = useState({
    retentionDays: 365,
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from backend
    api.get('/settings').then(setConfig).catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', config);
      toast({ title: "Settings saved" });
    } catch (error) {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure your AWS Cost Optimizer platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Configuration</CardTitle>
          <CardDescription>Manage how the platform processes your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="currency">Display Currency</Label>
            <Input 
              id="currency" 
              value={config.currency} 
              disabled 
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Currently only USD is supported.</p>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">Data Retention</p>
              <p className="text-muted-foreground">
                The system fetches cost data for the last 12 months from AWS Cost Explorer.
              </p>
            </div>
          </div>
          
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}