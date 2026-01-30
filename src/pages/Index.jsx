import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AnalyticsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard since analytics is now integrated there
    navigate('/');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen text-muted-foreground">
      Redirecting to Dashboard...
    </div>
  );
}