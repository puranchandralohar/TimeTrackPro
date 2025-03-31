import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Header } from "@/components/layout/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { format, parseISO, startOfWeek, addDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeEntry } from "@shared/schema";

export default function Reports() {
  const [, navigate] = useLocation();
  const { employee, isAuthenticated, isLoading } = useAuth();
  
  const { data: timeEntries, isLoading: entriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries', employee?.id],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Prepare data for charts
  const prepareWeeklyData = () => {
    if (!timeEntries || !projects) return [];

    const projectsMap = new Map();
    projects.forEach((project: any) => {
      projectsMap.set(project.id, project.name);
    });

    // Get current week's start
    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    // Initialize days of the week
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfCurrentWeek, i);
      return {
        day: format(day, 'EEE'),
        date: format(day, 'yyyy-MM-dd'),
        total: 0
      };
    });

    // Sum hours by day
    timeEntries.forEach(entry => {
      const entryDate = entry.date;
      const dayIndex = weekData.findIndex(d => d.date === entryDate);
      if (dayIndex >= 0) {
        weekData[dayIndex].total += entry.hours;
        
        // Add project specific hours
        const projectName = projectsMap.get(entry.projectId) || `Project ${entry.projectId}`;
        weekData[dayIndex][projectName] = (weekData[dayIndex][projectName] || 0) + entry.hours;
      }
    });

    return weekData;
  };

  const calculateProjectTotals = () => {
    if (!timeEntries || !projects) return [];

    const projectTotals = new Map();
    
    // Initialize with project names
    projects.forEach((project: any) => {
      projectTotals.set(project.id, { 
        id: project.id,
        name: project.name, 
        hours: 0 
      });
    });
    
    // Sum hours by project
    timeEntries.forEach(entry => {
      const project = projectTotals.get(entry.projectId);
      if (project) {
        project.hours += entry.hours;
      }
    });
    
    return Array.from(projectTotals.values())
      .sort((a, b) => b.hours - a.hours);
  };

  const weeklyData = prepareWeeklyData();
  const projectTotals = calculateProjectTotals();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reports" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background pb-16 md:pb-6">
          <h1 className="text-2xl font-semibold mb-6">Time Reports</h1>
          
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Hours</CardTitle>
                  <CardDescription>
                    Hours logged for the current week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {entriesLoading || projectsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={weeklyData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total" name="Total Hours" fill="#2563EB" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="w-full md:w-1/3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Project Breakdown</CardTitle>
                  <CardDescription>
                    Hours logged by project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {entriesLoading || projectsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projectTotals.map((project) => (
                        <div key={project.id} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{project.name}</span>
                            <span>{project.hours} hrs</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full"
                              style={{ 
                                width: `${Math.min(100, (project.hours / 40) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Time Log Summary</CardTitle>
                <CardDescription>
                  Summary of your time entries
                </CardDescription>
              </div>
              <Select defaultValue="week">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries && timeEntries.length > 0 ? (
                      timeEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            {entry.project?.name}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                          <TableCell className="text-right">{entry.hours}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No time entries found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
