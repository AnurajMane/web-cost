import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AWSAccount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, Cloud, ArrowRight, RefreshCw, Calendar } from 'lucide-react';
import { CostChart } from '@/components/dashboard/CostChart';
import { ServiceBreakdown } from '@/components/dashboard/ServiceBreakdown';
import { MonthlyBilling } from '@/components/dashboard/MonthlyBilling';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend, Label } from 'recharts';

interface MonthlyData {
  month: string;
  cost: number;
  monthKey: string;
  services: Record<string, number>;
}

interface ServiceData {
  name: string;
  value: number;
  color: string;
}

interface TimeSeriesServiceData {
  date: string;
  [key: string]: string | number;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const SERVICE_COLORS: Record<string, string> = {};
let colorIndex = 0;

export function DashboardPage() {
  const [accounts, setAccounts] = useState<AWSAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [potentialSavings, setPotentialSavings] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [monthComparison, setMonthComparison] = useState<{ current: number; previous: number; change: number }>({ current: 0, previous: 0, change: 0 });
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [timeSeriesServiceData, setTimeSeriesServiceData] = useState<TimeSeriesServiceData[]>([]);
  const [topServices, setTopServices] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();

    // Auto-refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadData = async () => {
    await loadAccounts();
    await loadCostSummary();
    await loadMonthlyAnalytics();
    await loadTimeSeriesServiceData();
    setRefreshKey(prev => prev + 1);
  };

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from('aws_accounts')
      .select('*')
      .eq('is_active', true);

    if (!error && data) {
      setAccounts(data);
    }
    setLoading(false);
  };

  const loadCostSummary = async () => {
    try {
      // Get all cost data (sum of all months)
      const { data, error } = await supabase
        .from('cost_data')
        .select('cost_amount');

      if (!error && data && data.length > 0) {
        const total = data.reduce((sum, record) => sum + parseFloat(record.cost_amount.toString()), 0);
        setTotalCost(total);
      } else {
        setTotalCost(0);
      }
    } catch (error) {
      console.error('Error loading cost summary:', error);
      setTotalCost(0);
    }
  };

  const loadMonthlyAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_data')
        .select('record_date, cost_amount, service_name')
        .order('record_date', { ascending: false });

      if (!error && data && data.length > 0) {
        // Group by month
        const monthlyMap = new Map<string, { cost: number; services: Record<string, number> }>();

        data.forEach((record) => {
          const date = new Date(record.record_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const cost = parseFloat(record.cost_amount.toString());
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { cost: 0, services: {} });
          }

          const monthData = monthlyMap.get(monthKey)!;
          monthData.cost += cost;

          if (!monthData.services[record.service_name]) {
            monthData.services[record.service_name] = 0;
          }
          monthData.services[record.service_name] += cost;
        });

        // Convert to array and sort
        const monthsArray = Array.from(monthlyMap.entries())
          .map(([key, value]) => {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
              month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
              monthKey: key,
              cost: parseFloat(value.cost.toFixed(2)),
              services: value.services,
            };
          })
          .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

        setMonthlyData(monthsArray);

        // Calculate month-over-month comparison
        if (monthsArray.length >= 2) {
          const currentCost = monthsArray[0].cost;
          const previousCost = monthsArray[1].cost;
          const change = previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0;
          
          setMonthComparison({
            current: currentCost,
            previous: previousCost,
            change: parseFloat(change.toFixed(1)),
          });

          // Calculate potential savings (if costs decreased)
          const savings = previousCost > currentCost ? previousCost - currentCost : 0;
          setPotentialSavings(savings);
        }

        // Generate service breakdown for current month
        if (monthsArray.length > 0) {
          const currentMonthServices = monthsArray[0].services;
          const sorted = Object.entries(currentMonthServices)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

          const formatted = sorted.map(([name, value], index) => ({
            name,
            value: parseFloat(value.toFixed(2)),
            color: COLORS[index % COLORS.length],
          }));

          setServiceData(formatted);
          setTopServices(sorted.map(([name]) => name));
        }
      }
    } catch (error) {
      console.error('Error loading monthly analytics:', error);
    }
  };

  const loadTimeSeriesServiceData = async () => {
    try {
      // Get last 6 months of data
      const { data, error } = await supabase
        .from('cost_data')
        .select('record_date, cost_amount, service_name')
        .order('record_date', { ascending: true });

      if (!error && data && data.length > 0) {
        // Group by month and service
        const monthlyServiceMap = new Map<string, Record<string, number>>();

        data.forEach((record) => {
          const date = new Date(record.record_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const cost = parseFloat(record.cost_amount.toString());
          const service = record.service_name;

          if (!monthlyServiceMap.has(monthKey)) {
            monthlyServiceMap.set(monthKey, {});
          }

          const monthData = monthlyServiceMap.get(monthKey)!;
          if (!monthData[service]) {
            monthData[service] = 0;
          }
          monthData[service] += cost;
        });

        // Convert to array and get top 5 services overall
        const allServices = new Map<string, number>();
        monthlyServiceMap.forEach((services) => {
          Object.entries(services).forEach(([service, cost]) => {
            allServices.set(service, (allServices.get(service) || 0) + cost);
          });
        });

        const topServicesList = Array.from(allServices.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name]) => name);

        // Assign colors to top services
        topServicesList.forEach((service, index) => {
          SERVICE_COLORS[service] = COLORS[index % COLORS.length];
        });

        // Format data for stacked area chart
        const formatted = Array.from(monthlyServiceMap.entries())
          .map(([monthKey, services]) => {
            const [year, month] = monthKey.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            const dataPoint: TimeSeriesServiceData = {
              date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              monthKey,
            };

            // Add top services to data point
            topServicesList.forEach((service) => {
              dataPoint[service] = parseFloat((services[service] || 0).toFixed(2));
            });

            return dataPoint;
          })
          .sort((a, b) => (a.monthKey as string).localeCompare(b.monthKey as string))
          .slice(-6); // Last 6 months

        setTimeSeriesServiceData(formatted);
        setTopServices(topServicesList);
      }
    } catch (error) {
      console.error('Error loading time series service data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <Cloud className="h-24 w-24 text-muted-foreground mx-auto" />
          <h2 className="text-3xl font-bold">Welcome to AWS Cost Optimizer</h2>
          <p className="text-muted-foreground max-w-md">
            Connect your AWS account to start optimizing your cloud costs with AI-powered insights
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/accounts')} className="gap-2">
          Connect AWS Account
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your AWS cost and usage</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spend (All Time)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Cumulative across all months</p>
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
            <div className={`text-2xl font-bold ${
              monthComparison.change >= 0 ? 'text-destructive' : 'text-success'
            }`}>
              {monthComparison.change >= 0 ? '+' : ''}{monthComparison.change.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {monthComparison.change >= 0 ? 'Increased' : 'Decreased'} from last month
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">Connected AWS accounts</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No alerts triggered</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Monthly Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>6-Month Cost Trend</CardTitle>
                <CardDescription>Monthly spending comparison</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available. Sync your AWS account to view trends.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyData.slice(0, 6).reverse()}>
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
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Comparison</CardTitle>
                <CardDescription>Current vs previous month</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.length < 2 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Need at least 2 months of data for comparison
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Previous Month', cost: monthComparison.previous },
                      { name: 'Current Month', cost: monthComparison.current },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cost Trend by Service</CardTitle>
                <CardDescription>Monthly spending breakdown by top 5 AWS services</CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesServiceData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available. Sync your AWS account to view trends.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeSeriesServiceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                      />
                      <Legend 
                        wrapperStyle={{
                          paddingTop: '20px',
                        }}
                      />
                      {topServices.map((service, index) => (
                        <Area
                          key={service}
                          type="monotone"
                          dataKey={service}
                          stackId="1"
                          stroke={SERVICE_COLORS[service] || COLORS[index % COLORS.length]}
                          fill={SERVICE_COLORS[service] || COLORS[index % COLORS.length]}
                          fillOpacity={0.6}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost by Service</CardTitle>
                <CardDescription>Top 5 AWS services by cost (current month)</CardDescription>
              </CardHeader>
              <CardContent>
                {serviceData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No service data available. Sync your AWS account.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={serviceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {serviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {serviceData.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="font-medium text-sm">{entry.name}</span>
                          </div>
                          <span className="font-bold">${entry.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Complete these steps to optimize your AWS costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
                <div className="bg-success/10 p-2 rounded-lg">
                  <Cloud className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">AWS Account Connected</h4>
                  <p className="text-sm text-muted-foreground">You've successfully connected {accounts.length} AWS account(s)</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border border-dashed border-border rounded-lg">
                <div className="bg-muted p-2 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Configure AWS Cost Explorer API</h4>
                  <p className="text-sm text-muted-foreground mb-2">Add your AWS credentials to start fetching cost data</p>
                  <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
                    Go to Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <MonthlyBilling />
        </TabsContent>
      </Tabs>
    </div>
  );
}