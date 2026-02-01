import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FreeTierUsage = () => {
  const [usageData, setUsageData] = useState([]);

  useEffect(() => {
    analyticsApi.get('/cost/free-tier-status')
      .then(res => setUsageData(res.data))
      .catch(err => console.error("Error fetching usage:", err));
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {usageData.map((item, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{item.service}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {item.usageValue} / {item.limitValue} {item.unit}
            </div>
            <Progress 
              value={(item.usageValue / item.limitValue) * 100} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FreeTierUsage;