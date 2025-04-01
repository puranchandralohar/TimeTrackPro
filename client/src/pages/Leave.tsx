import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LeaveType, LeaveApplication } from "@shared/schema";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileNav } from "@/components/layout/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";

// Leave application form schema
const leaveSchema = z.object({
  leaveTypeId: z.coerce.number().min(1, "Please select a leave type"),
  fromDate: z.date({
    required_error: "From date is required",
  }),
  toDate: z.date({
    required_error: "To date is required",
  }),
  reason: z.string().min(3, "Reason is required"),
  isHalfDay: z.boolean().default(false),
}).refine((data) => {
  return data.toDate >= data.fromDate;
}, {
  message: "To date must be after or equal to From date",
  path: ["toDate"],
});

export default function Leave() {
  const { toast } = useToast();
  const { employee } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Form setup
  const form = useForm<z.infer<typeof leaveSchema>>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveTypeId: undefined,
      fromDate: new Date(),
      toDate: new Date(),
      reason: "",
      isHalfDay: false,
    },
  });

  // Define leave summary type
  type LeaveSummary = {
    allocations: {
      leaveType: LeaveType;
      allocated: number;
      used: number;
      pending: number;
      remaining: number;
    }[];
    totalAllocated: number;
    totalUsed: number;
    totalPending: number;
    totalRemaining: number;
  };

  // Fetch leave types
  const { data: leaveTypes = [] } = useQuery<LeaveType[]>({
    queryKey: ["/api/leave-types"],
    queryFn: () => apiRequest("GET", "/leave-types"),
  });

  // Fetch leave allocations
  const { data: leaveSummary } = useQuery<LeaveSummary>({
    queryKey: ["/api/leave-summary"],
    queryFn: () => apiRequest("GET", "/leave-summary"),
  });

  // Fetch leave applications
  const { data: leaveApplications = [] } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/leave-applications"],
    queryFn: () => apiRequest("GET", "/leave-applications"),
  });

  // Create leave application mutation
  const createLeaveMutation = useMutation({
    mutationFn: (data: z.infer<typeof leaveSchema>) => 
      apiRequest("/api/leave-applications", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          fromDate: format(data.fromDate, "yyyy-MM-dd"),
          toDate: format(data.toDate, "yyyy-MM-dd"),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-summary"] });
      form.reset();
      toast({
        title: "Leave application submitted",
        description: "Your leave request has been submitted for approval",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit leave application. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Submit handler
  function onSubmit(data: z.infer<typeof leaveSchema>) {
    createLeaveMutation.mutate(data);
  }

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-amber-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {!isMobile && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Leave Management" />
        <div className="flex-1 overflow-y-auto p-4">
          {isMobile && <MobileNav />}
          
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Leave Summary</TabsTrigger>
              <TabsTrigger value="apply">Apply for Leave</TabsTrigger>
              <TabsTrigger value="history">Leave History</TabsTrigger>
            </TabsList>
            
            {/* Leave Summary Tab */}
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Leave Balance Summary</CardTitle>
                  <CardDescription>Overview of your leave balances for the current year</CardDescription>
                </CardHeader>
                <CardContent>
                  {leaveSummary ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500">Total Allocated</div>
                          <div className="text-2xl font-bold text-blue-600">{leaveSummary.totalAllocated} days</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500">Remaining</div>
                          <div className="text-2xl font-bold text-green-600">{leaveSummary.totalRemaining} days</div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500">Pending</div>
                          <div className="text-2xl font-bold text-amber-600">{leaveSummary.totalPending} days</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500">Used</div>
                          <div className="text-2xl font-bold text-purple-600">{leaveSummary.totalUsed} days</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">Leave by Type</h3>
                        <div className="space-y-2">
                          {leaveSummary.allocations.map((allocation) => (
                            <div key={allocation.leaveType.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: allocation.leaveType.color || '#2563EB' }}
                                />
                                <span>{allocation.leaveType.name}</span>
                              </div>
                              <div className="flex space-x-4 text-sm">
                                <div className="text-gray-500">
                                  <span className="font-medium text-gray-700">{allocation.allocated}</span> allocated
                                </div>
                                <div className="text-gray-500">
                                  <span className="font-medium text-gray-700">{allocation.used}</span> used
                                </div>
                                <div className="text-gray-500">
                                  <span className="font-medium text-green-600">{allocation.remaining}</span> remaining
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center p-4">
                      <p>Loading leave summary...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Apply for Leave Tab */}
            <TabsContent value="apply">
              <Card>
                <CardHeader>
                  <CardTitle>Apply for Leave</CardTitle>
                  <CardDescription>Submit a new leave application</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="leaveTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Leave Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a leave type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {leaveTypes.map(type => (
                                  <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fromDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>From Date</FormLabel>
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                className="rounded-md border"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="toDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>To Date</FormLabel>
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                className="rounded-md border"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="isHalfDay"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Half Day</FormLabel>
                              <FormDescription>
                                Check this if you're applying for a half day leave
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Please provide a reason for your leave"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={createLeaveMutation.isPending}>
                        {createLeaveMutation.isPending ? "Submitting..." : "Submit Leave Application"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Leave History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Leave History</CardTitle>
                  <CardDescription>Your leave application history</CardDescription>
                </CardHeader>
                <CardContent>
                  {leaveApplications.length > 0 ? (
                    <div className="space-y-4">
                      {leaveApplications.map((application) => (
                        <div key={application.id} className="border rounded-md p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                            <div className="text-lg font-medium">
                              {application.leaveType?.name || "Unknown"}
                            </div>
                            <div>
                              {formatStatus(application.status || "pending")}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            <span>
                              {format(new Date(application.fromDate), "PP")} 
                              {' - '} 
                              {format(new Date(application.toDate), "PP")}
                            </span>
                            {application.isHalfDay && <span className="ml-2">(Half Day)</span>}
                          </div>
                          <div className="mt-2 text-sm">
                            <div className="font-medium">Reason:</div>
                            <div className="text-gray-700">{application.reason}</div>
                          </div>
                          {application.rejectionReason && (
                            <div className="mt-2 text-sm">
                              <div className="font-medium text-red-600">Rejection Reason:</div>
                              <div className="text-gray-700">{application.rejectionReason}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No leave applications found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}