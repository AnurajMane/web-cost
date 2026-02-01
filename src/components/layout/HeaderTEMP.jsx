import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Activity } from 'lucide-react'; // Added Activity icon
import { api } from '@/lib/api'; // Ensure this path is correct
import { toast } from "sonner"; // Using Sonner for status feedback

const getInitials = (name) => {
  if (!name) return 'U';
  const nameParts = name.trim().split(' ');
  if (nameParts.length > 1) {
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

function HeaderTEMP() {
  const { user, logout } = useAuth();

  // Health Check Logic
  const checkHealth = async () => {
    toast.promise(
      Promise.all([
        api.get('/auth/health'),     // Routes to Java
        api.get('/cost/health')      // Routes to C#
      ]),
      {
        loading: 'Checking system status...',
        success: () => 'All systems operational: Java & C# connected!',
        error: (err) => `Connection failed: ${err.message}`,
      }
    );
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">Cloud Cost Management</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Health Check Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkHealth}
          className="hidden md:flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          System Status
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} alt={user?.username} />
                <AvatarFallback>
                  {getInitials(user?.username)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
export default HeaderTEMP;