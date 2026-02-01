import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  DollarSign, 
  Cloud,
  ArrowUpRight,
  ArrowDownRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CostChart } from '@/components/dashboard/CostChart';
import { ServiceBreakdown } from '@/components/dashboard/ServiceBreakdown';
import { MonthlyBilling } from '@/components/dashboard/MonthlyBilling';
// Note: Ensure your api.js exports both authApi and analyticsApi
import { api } from '@/lib/api'; 
import FreeTierUsage from '@/components/dashboard/FreeTierUsage';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalCost: 0,
    forecastedCost: 0,
    previousMonthComparison: 0,
    activeAccounts: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from both Java (Auth/Profiles) and C# (Analytics)
      const [costSummary, accounts] = await Promise.all([
        api.get('/cost/monthly-summary'), // Calls C# service
        api.get('/profiles')                   // Calls Java service
      ]);

      setSummary({
        totalCost: costSummary.data?.total_mtd || 0,
        forecastedCost: costSummary.data?.forecasted || 0,
        previousMonthComparison: costSummary.data?.change_percent || 0,
        activeAccounts: accounts.data?.length || 0
      });
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cloud Cost Management</h2>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost (MTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {summary.previousMonthComparison >= 0 ? (
                <span className="text-destructive flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> +{summary.previousMonthComparison}%
                </span>
              ) : (
                <span className="text-green-500 flex items-center">
                  <ArrowDownRight className="h-3 w-3" /> {summary.previousMonthComparison}%
                </span>
              )}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecasted Month End</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.forecastedCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current spending patterns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoring Status</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground mt-1">
              Connected to AWS via C# Analytics Service
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NEW: AWS Free Tier Usage Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">AWS Free Tier Monitoring</h3>
        <FreeTierUsage /> 
      </div>

      {/* Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Cost Overview</TabsTrigger>
          <TabsTrigger value="services">Service Breakdown</TabsTrigger>
          <TabsTrigger value="billing">Monthly Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <CostChart />
        </TabsContent>
        
        <TabsContent value="services">
          <ServiceBreakdown />
        </TabsContent>
        
        <TabsContent value="billing">
          <MonthlyBilling />
        </TabsContent>
      </Tabs>
    </div>
  );
}