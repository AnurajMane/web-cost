import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
      <p className="text-xl text-muted-foreground mb-6">Page not found</p>
      <Link 
        to="/" 
        className="text-primary hover:underline font-medium transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}