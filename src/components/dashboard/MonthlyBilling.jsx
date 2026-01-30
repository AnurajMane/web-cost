import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyData {
  month: string;
  cost: number;
  services: Record<string, number>;
}

interface ServiceBreakdown {
  service: string;
  cost: number;
  percentage: number;
}

export function MonthlyBilling() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthComparison, setMonthComparison] = useState<{ current: number; previous: number; change: number }>({
    current: 0,
    previous: 0,
    change: 0,
  });

  useEffect(() => {
    loadMonthlyData();
  }, []);

  useEffect(() => {
    if (selectedMonth && monthlyData.length > 0) {
      calculateServiceBreakdown();
      calculateMonthComparison();
    }
  }, [selectedMonth, monthlyData]);

  const loadMonthlyData = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_data')
        .select('record_date, cost_amount, service_name')
        .order('record_date', { ascending: false });

      console.log('Loaded cost data:', data);

      if (!error && data && data.length > 0) {
        // Group by month
        const monthlyMap = new Map<string, { cost: number; services: Record<string, number> }>();

        data.forEach((record) => {
          const date = new Date(record.record_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { cost: 0, services: {} });
          }

          const monthData = monthlyMap.get(monthKey)!;
          const cost = parseFloat(record.cost_amount.toString());
          monthData.cost += cost;

          if (!monthData.services[record.service_name]) {
            monthData.services[record.service_name] = 0;
          }
          monthData.services[record.service_name] += cost;
        });

        // Convert to array and sort by month
        const monthsArray = Array.from(monthlyMap.entries())
          .map(([key, value]) => {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
              month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
              monthKey: key,
              cost: parseFloat(value.cost.toFixed(2)),
              services: value.services,
            };
          })
          .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

        console.log('Processed monthly data:', monthsArray);
        setMonthlyData(monthsArray);
        const months = monthsArray.map((m) => m.monthKey);
        setAvailableMonths(months);
        if (months.length > 0) {
          setSelectedMonth(months[0]); // Select most recent month
        }
      } else {
        console.log('No cost data found or error:', error);
      }
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateServiceBreakdown = () => {
    const currentMonthData = monthlyData.find((m) => m.monthKey === selectedMonth);
    if (!currentMonthData) return;

    const breakdown = Object.entries(currentMonthData.services)
      .map(([service, cost]) => ({
        service,
        cost: parseFloat(cost.toFixed(2)),
        percentage: parseFloat(((cost / currentMonthData.cost) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.cost - a.cost);

    setServiceBreakdown(breakdown);
  };

  const calculateMonthComparison = () => {
    const currentIndex = monthlyData.findIndex((m) => m.monthKey === selectedMonth);
    if (currentIndex === -1) return;

    const currentCost = monthlyData[currentIndex].cost;
    const previousCost = currentIndex < monthlyData.length - 1 ? monthlyData[currentIndex + 1].cost : 0;
    const change = previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0;

    setMonthComparison({
      current: currentCost,
      previous: previousCost,
      change: parseFloat(change.toFixed(1)),
    });
  };

  const getChartData = () => {
    return monthlyData.slice(0, 6).reverse().map((m) => ({
      month: m.month.split(' ')[0], // Just month name
      cost: m.cost,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Loading monthly billing data...
      </div>
    );
  }

  if (monthlyData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No billing data available</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Sync your AWS account to view month-wise billing and cost usage
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedMonthLabel = monthlyData.find((m) => m.monthKey === selectedMonth)?.month || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Monthly Billing Analysis</h3>
          <p className="text-muted-foreground">Track and compare your AWS costs by month</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthlyData.map((month) => (
              <SelectItem key={month.monthKey} value={month.monthKey}>
                {month.month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{selectedMonthLabel} Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthComparison.current.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total AWS spend</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Previous Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthComparison.previous.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyData[monthlyData.findIndex((m) => m.monthKey === selectedMonth) + 1]?.month || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Month-over-Month</CardTitle>
            {monthComparison.change >= 0 ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-success" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                monthComparison.change >= 0 ? 'text-destructive' : 'text-success'
              }`}
            >
              {monthComparison.change >= 0 ? '+' : ''}
              {monthComparison.change.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Cost change</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>6-Month Trend</CardTitle>
            <CardDescription>Monthly cost comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                />
                <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Breakdown - {selectedMonthLabel}</CardTitle>
            <CardDescription>Cost by AWS service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceBreakdown.slice(0, 8).map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate flex-1">{item.service}</span>
                    <span className="font-bold ml-2">${item.cost.toFixed(2)}</span>
                    <span className="text-muted-foreground ml-2 w-12 text-right">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {serviceBreakdown.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No service data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Services - {selectedMonthLabel}</CardTitle>
          <CardDescription>Complete breakdown of AWS service costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Service</th>
                  <th className="text-right py-3 px-4 font-medium">Cost</th>
                  <th className="text-right py-3 px-4 font-medium">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {serviceBreakdown.map((item, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{item.service}</td>
                    <td className="text-right py-3 px-4 font-mono">${item.cost.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-muted-foreground">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-border">
                  <td className="py-3 px-4">Total</td>
                  <td className="text-right py-3 px-4 font-mono">${monthComparison.current.toFixed(2)}</td>
                  <td className="text-right py-3 px-4">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
