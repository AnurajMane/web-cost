import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  date: string;
  cost: number;
}

interface CostChartProps {
  refreshTrigger?: number;
}

export function CostChart({ refreshTrigger }: CostChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadChartData();
    }
  }, [refreshTrigger]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      // Get data from the last 30 days
      const now = new Date();
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const past = new Date();
      past.setDate(past.getDate() - 30);
      const startDate = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;

      console.log('Loading chart data from:', startDate, 'to', endDate);

      const { data, error } = await supabase
        .from('cost_data')
        .select('record_date, cost_amount')
        .gte('record_date', startDate)
        .lte('record_date', endDate)
        .order('record_date', { ascending: true });

      console.log('Cost chart raw data:', data);
      console.log('Cost chart error:', error);

      if (!error && data && data.length > 0) {
        // Aggregate costs by date
        const aggregated: Record<string, { cost: number; sortKey: string }> = {};
        
        data.forEach(record => {
          const date = record.record_date;
          const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          const amount = parseFloat(record.cost_amount.toString());
          
          if (!aggregated[displayDate]) {
            aggregated[displayDate] = { cost: 0, sortKey: date };
          }
          aggregated[displayDate].cost += amount;
        });

        const formatted = Object.entries(aggregated)
          .map(([date, { cost, sortKey }]) => ({
            date,
            cost: parseFloat(cost.toFixed(2)),
            sortKey,
          }))
          .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

        console.log('Formatted chart data:', formatted);
        setChartData(formatted.map(({ date, cost }) => ({ date, cost })));
      } else {
        console.log('No data found or error:', error);
        setChartData([]);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Trend</CardTitle>
        <CardDescription>Daily AWS spending over time</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Loading chart data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No cost data available. Sync your AWS account to view cost trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
              />
              <Line 
                type="monotone" 
                dataKey="cost" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
