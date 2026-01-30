import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function AnalyticsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard since analytics is now integrated
    navigate('/dashboard');
  }, [navigate]);

  return null;
}
