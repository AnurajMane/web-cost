import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      // Fetches from your new microservices architecture
      const data = await api.get('/alerts');
      setAlerts(data || []);
    } catch (error) {
      console.log("No alerts found or API not ready", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading cost alerts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Budget Alerts</h2>
        <p className="text-muted-foreground">
          Monitor and manage your AWS cost intelligence notifications.
        </p>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              No Active Alerts
            </CardTitle>
            <CardDescription>
              Your AWS spending is currently within all defined budget thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Great job! You have not exceeded any budget thresholds this month. New alerts will appear here if spending patterns shift.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
              <div className="flex items-start gap-3">
                {alert.severity === 'critical' ? (
                  <ShieldAlert className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                <div>
                  <AlertTitle className="font-bold">{alert.title}</AlertTitle>
                  <AlertDescription className="mt-1">
                    {alert.description}
                    <div className="mt-2 text-xs opacity-70">
                      Detected: {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}