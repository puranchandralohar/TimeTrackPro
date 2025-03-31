import { useState } from "react";
import { MenuIcon, BellIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { employee } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <header className="bg-red border-b border-border h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center md:hidden">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold text-primary">Activity Tracker - AT 2.0</h1>
      </div>
      
      <div className="hidden md:block">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 relative">
          <BellIcon className="h-6 w-6 text-muted-foreground" />
          <span className={cn(
            "absolute top-1 right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs text-white bg-primary",
            !employee?.notifications && "hidden"
          )}>
            {employee?.notifications || 0}
          </span>
        </Button>
        
        <div className="md:hidden">
          <div className="h-8 w-8 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-medium">
            {employee?.name.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
