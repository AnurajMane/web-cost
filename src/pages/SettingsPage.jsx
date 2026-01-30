import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const [config, setConfig] = useState({
    retentionDays: 365,
    currency: 'USD',
    alertThreshold: 500
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetches general configuration from the new backend
    api.get('/settings')
      .then(data => {
        if (data) setConfig(data);
      })
      .catch(() => {
        // Fallback for initial setup if backend isn't ready
        console.log("Using local default settings");
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Logic for saving settings to your new microservices
      await api.put('/settings', config);
      toast({ 
        title: "Settings saved", 
        description: "Your AWS Cost Intelligence configuration has been updated." 
      });
    } catch (error) {
      toast({ 
        title: "Failed to save", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground">Configure your AWS Cost Intelligence SaaS platform</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Configuration</CardTitle>
            <CardDescription>Manage how the platform processes and displays your AWS data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="currency">Display Currency</Label>
              <Input 
                id="currency"
                value={config.currency} 
                onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                placeholder="USD"
              />
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="retention">Data Retention (Days)</Label>
              <Input 
                id="retention"
                type="number"
                value={config.retentionDays} 
                onChange={(e) => setConfig({ ...config, retentionDays: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Number of days to store historical AWS cost metrics.</p>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="threshold">Monthly Alert Threshold ($)</Label>
              <Input 
                id="threshold"
                type="number"
                value={config.alertThreshold} 
                onChange={(e) => setConfig({ ...config, alertThreshold: parseInt(e.target.value) })}
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}