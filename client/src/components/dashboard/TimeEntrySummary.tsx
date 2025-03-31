import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClockIcon, BarChart2Icon, FolderIcon } from "lucide-react";
import { TimeEntry } from "@shared/schema";

interface TimeEntrySummaryProps {
  employeeId: number;
}

export function TimeEntrySummary({ employeeId }: TimeEntrySummaryProps) {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['/api/time-entries/summary', employeeId],
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-36 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { todayHours, weekTotal, topProject } = summaryData || {
    todayHours: 0,
    weekTotal: 0,
    topProject: { name: 'None', hours: 0 }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">Today's Hours</h3>
              <p className="text-2xl font-semibold mt-1">{todayHours}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-2">
              <ClockIcon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="text-success">
              {summaryData?.dailyDiff > 0 ? `+${summaryData.dailyDiff} hours` : ''}
            </span>
            {summaryData?.dailyDiff > 0 ? ' compared to yesterday' : ''}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">Week Total</h3>
              <p className="text-2xl font-semibold mt-1">{weekTotal}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-2">
              <BarChart2Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="text-success">{Math.round((weekTotal / 40) * 100)}%</span> of 40-hour goal
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">Top Project</h3>
              <p className="text-2xl font-semibold mt-1">{topProject.name}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-2">
              <FolderIcon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="text-primary-light">{topProject.hours} hours</span> this week
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
