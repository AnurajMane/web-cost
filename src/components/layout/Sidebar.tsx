import { NavLink } from 'react-router-dom';
import { CloudCog, LayoutDashboard, Cloud, TrendingDown, MessageSquare, Settings, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'AWS Accounts', href: '/accounts', icon: Cloud },
  { name: 'AI Assistant', href: '/assistant', icon: MessageSquare },
  { name: 'Alerts', href: '/alerts', icon: AlertCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-card border-r border-border">
        <div className="flex items-center h-16 px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <CloudCog className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text">AWS Optimizer</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}