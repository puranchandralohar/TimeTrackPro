import { useEffect } from "react";
import { useLocation } from "wouter";
import { PlusIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Header } from "@/components/layout/Header";
import { TimeEntrySummary } from "@/components/dashboard/TimeEntrySummary";
import { TimeEntryForm } from "@/components/dashboard/TimeEntryForm";
import { TimeEntryTable } from "@/components/dashboard/TimeEntryTable";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { employee, isAuthenticated, isLoading } = useAuth();
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Time Tracking Dashboard" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background pb-16 md:pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Hello, {employee?.name.split(' ')[0]}!</h1>
              <p className="text-muted-foreground mt-1">Track your time and boost your productivity</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Dialog open={showNewEntryForm} onOpenChange={setShowNewEntryForm}>
                <DialogTrigger asChild>
                  <Button className="md:hidden bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md shadow-sm flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Time Entry
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <TimeEntryForm />
                </DialogContent>
              </Dialog>
              
              <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md shadow-sm items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Time Entry
              </Button>
            </div>
          </div>
          
          {employee && <TimeEntrySummary employeeId={employee.id} />}
          
          <div className="hidden md:block">
            <TimeEntryForm />
          </div>
          
          <TimeEntryTable />
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
