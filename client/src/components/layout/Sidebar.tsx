import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ClockIcon, BarChart2Icon, FolderIcon, UserIcon, SettingsIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const [location] = useLocation();
  const { employee, logout } = useAuth();

  const NavItem = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
    const isActive = location === href;
    
    return (
      <Link href={href}>
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start px-4 py-3 h-auto text-base font-normal",
            isActive && "bg-blue-50 text-primary border-l-4 border-primary"
          )}
        >
          <Icon className="h-5 w-5 mr-3" />
          {children}
        </Button>
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-border h-screen">
      <div className="flex items-center justify-center h-16 border-b border-border">
        <h1 className="text-xl font-semibold text-primary">TimeTrack</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto pt-4">
        <div className="px-4 py-2 text-sm font-medium text-muted-foreground uppercase">Main</div>
        
        <NavItem href="/" icon={ClockIcon}>Time Tracking</NavItem>
        <NavItem href="/reports" icon={BarChart2Icon}>Reports</NavItem>
        <NavItem href="/projects" icon={FolderIcon}>Projects</NavItem>
        
        <div className="px-4 py-2 mt-6 text-sm font-medium text-muted-foreground uppercase">Account</div>
        
        <NavItem href="/profile" icon={UserIcon}>Profile</NavItem>
        <NavItem href="/settings" icon={SettingsIcon}>Settings</NavItem>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start px-4 py-3 h-auto text-base font-normal text-red-600 hover:bg-red-50 hover:text-red-600"
          onClick={logout}
        >
          <LogOutIcon className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </nav>
      
      {employee && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-medium">
              {employee.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{employee.name}</p>
              <p className="text-xs text-muted-foreground">{employee.position}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
