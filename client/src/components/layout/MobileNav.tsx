import { Link, useLocation } from "wouter";
import { ClockIcon, BarChart2Icon, FolderIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();

  const NavItem = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
    const isActive = location === href;
    
    return (
      <Link href={href}>
        <a className={cn(
          "flex flex-col items-center py-2",
          isActive ? "text-primary" : "text-muted-foreground"
        )}>
          <Icon className="h-6 w-6" />
          <span className="text-xs mt-1">{children}</span>
        </a>
      </Link>
    );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-10">
      <div className="flex items-center justify-around">
        <NavItem href="/" icon={ClockIcon}>Time</NavItem>
        <NavItem href="/reports" icon={BarChart2Icon}>Reports</NavItem>
        <NavItem href="/projects" icon={FolderIcon}>Projects</NavItem>
        <NavItem href="/profile" icon={UserIcon}>Profile</NavItem>
      </div>
    </div>
  );
}
