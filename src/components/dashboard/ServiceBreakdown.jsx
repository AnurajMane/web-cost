import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ServiceData {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface ServiceBreakdownProps {
  refreshTrigger?: number;
}

export function ServiceBreakdown({ refreshTrigger }: ServiceBreakdownProps) {
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceData();
  }, []);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadServiceData();
    }
  }, [refreshTrigger]);

  const loadServiceData = async () => {
    setLoading(true);
    try {
      // Get data from current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
      
      // Get last day of month
      const lastDay = new Date(year, month, 0).getDate();
      const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      console.log('Loading service data from:', startOfMonth, 'to', endOfMonth);

      const { data, error } = await supabase
        .from('cost_data')
        .select('service_name, cost_amount')
        .gte('record_date', startOfMonth)
        .lte('record_date', endOfMonth);

      console.log('Service breakdown raw data:', data);
      console.log('Service breakdown error:', error);

      if (!error && data && data.length > 0) {
        // Aggregate costs by service
        const aggregated: Record<string, number> = {};
        
        data.forEach(record => {
          const service = record.service_name;
          const amount = parseFloat(record.cost_amount.toString());
          aggregated[service] = (aggregated[service] || 0) + amount;
        });

        // Sort by cost and take top 5
        const sorted = Object.entries(aggregated)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        const formatted = sorted.map(([name, value], index) => ({
          name,
          value: parseFloat(value.toFixed(2)),
          color: COLORS[index % COLORS.length],
        }));

        console.log('Formatted service data:', formatted);
        setServiceData(formatted);
      } else {
        console.log('No service data found or error:', error);
        setServiceData([]);
      }
    } catch (error) {
      console.error('Error loading service data:', error);
      setServiceData([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost by Service</CardTitle>
        <CardDescription>Breakdown of AWS service costs</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Loading service breakdown...
          </div>
        ) : serviceData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No cost data available. Sync your AWS account to view service breakdown.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}