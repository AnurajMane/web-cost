import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AnalyticsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirects to the root Dashboard as analytics are integrated there
    navigate('/');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen text-muted-foreground">
      Redirecting to Dashboard...
    </div>
  );
}