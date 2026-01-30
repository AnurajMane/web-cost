import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Bell } from 'lucide-react';
import { api } from '@/lib/api';

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await api.get('/alerts');
      setAlerts(data);
    } catch (error) {
      console.log("No alerts found or API not ready");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Budget Alerts</h2>
        <p className="text-muted-foreground">Monitor and manage your cost alerts</p>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              No Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Great job! You have not exceeded any budget thresholds this month.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
             <Card key={alert.id} className="border-l-4 border-l-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    {alert.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{alert.description}</p>
                  <p className="text-sm text-muted-foreground mt-2">Threshold: ${alert.threshold}</p>
                </CardContent>
             </Card>
          ))}
        </div>
      )}
    </div>
  );
}