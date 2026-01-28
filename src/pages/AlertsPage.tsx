import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export function AlertsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Budget Alerts</h2>
        <p className="text-muted-foreground">Monitor and manage your cost alerts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            No Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Budget alerts will appear here when spending thresholds are exceeded. Configure your budgets and alert
            thresholds in the Settings page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}