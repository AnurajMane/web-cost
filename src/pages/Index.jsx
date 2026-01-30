import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">
        AWS Cost Optimizer
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        Take control of your cloud spending with AI-driven insights and real-time monitoring.
      </p>
      <div className="flex gap-4">
        <Link to="/login">
          <Button size="lg">Log In</Button>
        </Link>
        <Link to="/signup">
          <Button variant="outline" size="lg">Create Account</Button>
        </Link>
      </div>
    </div>
  );
}