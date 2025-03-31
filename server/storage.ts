import { 
  employees, type Employee, type InsertEmployee,
  projects, type Project, type InsertProject,
  timeEntries, type TimeEntry, type InsertTimeEntry,
  leaveTypes, type LeaveType, type InsertLeaveType,
  leaveAllocations, type LeaveAllocation, type InsertLeaveAllocation,
  leaveApplications, type LeaveApplication, type InsertLeaveApplication
} from "@shared/schema";
import { format } from "date-fns";

// Storage interface
export interface IStorage {
  // Employee methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Time entry methods
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  getTimeEntriesByEmployee(employeeId: number): Promise<TimeEntry[]>;
  getTimeEntriesByDate(employeeId: number, date: string): Promise<TimeEntry[]>;
  getTimeEntriesForWeek(employeeId: number, weekStart: string, weekEnd: string): Promise<TimeEntry[]>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, timeEntry: Partial<TimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;
  
  // Leave type methods
  getLeaveType(id: number): Promise<LeaveType | undefined>;
  getLeaveTypes(): Promise<LeaveType[]>;
  createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType>;
  
  // Leave allocation methods
  getLeaveAllocation(id: number): Promise<LeaveAllocation | undefined>;
  getLeaveAllocationsByEmployee(employeeId: number): Promise<(LeaveAllocation & { leaveType: LeaveType })[]>;
  createLeaveAllocation(leaveAllocation: InsertLeaveAllocation): Promise<LeaveAllocation>;
  updateLeaveAllocation(id: number, leaveAllocation: Partial<LeaveAllocation>): Promise<LeaveAllocation | undefined>;
  
  // Leave application methods
  getLeaveApplication(id: number): Promise<LeaveApplication | undefined>;
  getLeaveApplicationsByEmployee(employeeId: number): Promise<(LeaveApplication & { leaveType: LeaveType })[]>;
  createLeaveApplication(leaveApplication: InsertLeaveApplication): Promise<LeaveApplication>;
  updateLeaveApplication(id: number, leaveApplication: Partial<LeaveApplication>): Promise<LeaveApplication | undefined>;
  
  // Leave summary methods
  getEmployeeLeaveSummary(employeeId: number): Promise<{
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
  }>;
  
  // Summary methods
  getEmployeeTimeSummary(employeeId: number): Promise<{
    todayHours: number;
    weekTotal: number;
    dailyDiff: number;
    topProject: { name: string; hours: number };
  }>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private employees: Map<number, Employee>;
  private projects: Map<number, Project>;
  private timeEntries: Map<number, TimeEntry>;
  private leaveTypes: Map<number, LeaveType>;
  private leaveAllocations: Map<number, LeaveAllocation>;
  private leaveApplications: Map<number, LeaveApplication>;
  private employeeIdCounter: number;
  private projectIdCounter: number;
  private timeEntryIdCounter: number;
  private leaveTypeIdCounter: number;
  private leaveAllocationIdCounter: number;
  private leaveApplicationIdCounter: number;

  constructor() {
    this.employees = new Map();
    this.projects = new Map();
    this.timeEntries = new Map();
    this.leaveTypes = new Map();
    this.leaveAllocations = new Map();
    this.leaveApplications = new Map();
    this.employeeIdCounter = 1;
    this.projectIdCounter = 1;
    this.timeEntryIdCounter = 1;
    this.leaveTypeIdCounter = 1;
    this.leaveAllocationIdCounter = 1;
    this.leaveApplicationIdCounter = 1;
    
    // Seed some default data
    this.seedData();
  }

  // Employee methods
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      (employee) => employee.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.employeeIdCounter++;
    const employee: Employee = { 
      ...insertEmployee, 
      id, 
      notifications: 0,
      phone: insertEmployee.phone || null
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: number, employeeData: Partial<Employee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updatedEmployee = { ...employee, ...employeeData };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const project: Project = { 
      id,
      name: insertProject.name,
      description: insertProject.description || null,
      channelName: insertProject.channelName || null,
      channelId: insertProject.channelId || null, 
      projectManagerEmail: insertProject.projectManagerEmail || null,
      clientName: insertProject.clientName || null,
      active: insertProject.active === undefined ? true : insertProject.active,
      priority: insertProject.priority || null,
      budget: insertProject.budget || null
    };
    this.projects.set(id, project);
    return project;
  }

  // Time entry methods
  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    const entry = this.timeEntries.get(id);
    
    if (entry) {
      return {
        ...entry,
        project: this.projects.get(entry.projectId)
      };
    }
    return undefined;
  }

  async getTimeEntriesByEmployee(employeeId: number): Promise<TimeEntry[]> {
    const entries = Array.from(this.timeEntries.values())
      .filter(entry => entry.employeeId === employeeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Include project data
    return entries.map(entry => ({
      ...entry,
      project: this.projects.get(entry.projectId)
    }));
  }

  async getTimeEntriesByDate(employeeId: number, date: string): Promise<TimeEntry[]> {
    const entries = Array.from(this.timeEntries.values())
      .filter(entry => entry.employeeId === employeeId && entry.date === date);
    
    // Include project data
    return entries.map(entry => ({
      ...entry,
      project: this.projects.get(entry.projectId)
    }));
  }

  async getTimeEntriesForWeek(employeeId: number, weekStart: string, weekEnd: string): Promise<TimeEntry[]> {
    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);
    
    const entries = Array.from(this.timeEntries.values())
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entry.employeeId === employeeId && 
               entryDate >= startDate && 
               entryDate <= endDate;
      });
    
    // Include project data
    return entries.map(entry => ({
      ...entry,
      project: this.projects.get(entry.projectId)
    }));
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = this.timeEntryIdCounter++;
    const timeEntry: TimeEntry = { 
      ...insertTimeEntry, 
      id, 
      createdAt: new Date()
    };
    this.timeEntries.set(id, timeEntry);
    
    // Return with project data
    return {
      ...timeEntry,
      project: this.projects.get(timeEntry.projectId)
    };
  }

  async updateTimeEntry(id: number, timeEntryData: Partial<TimeEntry>): Promise<TimeEntry | undefined> {
    const timeEntry = this.timeEntries.get(id);
    if (!timeEntry) return undefined;
    
    const updatedTimeEntry = { ...timeEntry, ...timeEntryData };
    this.timeEntries.set(id, updatedTimeEntry);
    
    // Return with project data
    return {
      ...updatedTimeEntry,
      project: this.projects.get(updatedTimeEntry.projectId)
    };
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  // Leave type methods
  async getLeaveType(id: number): Promise<LeaveType | undefined> {
    return this.leaveTypes.get(id);
  }

  async getLeaveTypes(): Promise<LeaveType[]> {
    return Array.from(this.leaveTypes.values());
  }

  async createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType> {
    const id = this.leaveTypeIdCounter++;
    const newLeaveType: LeaveType = {
      ...leaveType,
      id,
      description: leaveType.description || null,
      color: leaveType.color || null
    };
    this.leaveTypes.set(id, newLeaveType);
    return newLeaveType;
  }

  // Leave allocation methods
  async getLeaveAllocation(id: number): Promise<LeaveAllocation | undefined> {
    return this.leaveAllocations.get(id);
  }

  async getLeaveAllocationsByEmployee(employeeId: number): Promise<(LeaveAllocation & { leaveType: LeaveType })[]> {
    const allocations = Array.from(this.leaveAllocations.values())
      .filter(allocation => allocation.employeeId === employeeId);
    
    return allocations.map(allocation => ({
      ...allocation,
      leaveType: this.leaveTypes.get(allocation.leaveTypeId)!
    }));
  }

  async createLeaveAllocation(leaveAllocation: InsertLeaveAllocation): Promise<LeaveAllocation> {
    const id = this.leaveAllocationIdCounter++;
    const newAllocation: LeaveAllocation = {
      ...leaveAllocation,
      id,
      createdAt: new Date()
    };
    this.leaveAllocations.set(id, newAllocation);
    return newAllocation;
  }

  async updateLeaveAllocation(id: number, leaveAllocation: Partial<LeaveAllocation>): Promise<LeaveAllocation | undefined> {
    const allocation = this.leaveAllocations.get(id);
    if (!allocation) return undefined;
    
    const updatedAllocation = { ...allocation, ...leaveAllocation };
    this.leaveAllocations.set(id, updatedAllocation);
    return updatedAllocation;
  }

  // Leave application methods
  async getLeaveApplication(id: number): Promise<LeaveApplication | undefined> {
    const application = this.leaveApplications.get(id);
    if (!application) return undefined;
    
    return {
      ...application,
      leaveType: this.leaveTypes.get(application.leaveTypeId)
    };
  }

  async getLeaveApplicationsByEmployee(employeeId: number): Promise<(LeaveApplication & { leaveType: LeaveType })[]> {
    const applications = Array.from(this.leaveApplications.values())
      .filter(application => application.employeeId === employeeId)
      .sort((a, b) => {
        // Sort by application id if createdAt is not available
        if (!a.createdAt || !b.createdAt) {
          return b.id - a.id;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    
    return applications.map(application => ({
      ...application,
      leaveType: this.leaveTypes.get(application.leaveTypeId)!
    }));
  }

  async createLeaveApplication(leaveApplication: InsertLeaveApplication): Promise<LeaveApplication> {
    const id = this.leaveApplicationIdCounter++;
    const newApplication: LeaveApplication = {
      ...leaveApplication,
      id,
      status: "pending",
      createdAt: new Date(),
      approvedById: null,
      approvedAt: null,
      rejectionReason: null,
      isHalfDay: leaveApplication.isHalfDay || false
    };
    this.leaveApplications.set(id, newApplication);
    
    return {
      ...newApplication,
      leaveType: this.leaveTypes.get(newApplication.leaveTypeId)
    };
  }

  async updateLeaveApplication(id: number, leaveApplication: Partial<LeaveApplication>): Promise<LeaveApplication | undefined> {
    const application = this.leaveApplications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, ...leaveApplication };
    this.leaveApplications.set(id, updatedApplication);
    
    return {
      ...updatedApplication,
      leaveType: this.leaveTypes.get(updatedApplication.leaveTypeId)
    };
  }

  // Leave summary methods
  async getEmployeeLeaveSummary(employeeId: number): Promise<{
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
  }> {
    const allocations = await this.getLeaveAllocationsByEmployee(employeeId);
    const applications = await this.getLeaveApplicationsByEmployee(employeeId);
    
    let totalAllocated = 0;
    let totalUsed = 0;
    let totalPending = 0;
    let totalRemaining = 0;
    
    const allocationSummary = allocations.map(allocation => {
      const leaveType = allocation.leaveType;
      const allocatedDays = Number(allocation.allocatedDays);
      
      // Count used days (approved applications)
      const usedApplications = applications.filter(app => 
        app.leaveTypeId === allocation.leaveTypeId && app.status === "approved"
      );
      const usedDays = usedApplications.reduce((total, app) => {
        const start = new Date(app.fromDate);
        const end = new Date(app.toDate);
        const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return total + (app.isHalfDay ? days * 0.5 : days);
      }, 0);
      
      // Count pending days
      const pendingApplications = applications.filter(app => 
        app.leaveTypeId === allocation.leaveTypeId && app.status === "pending"
      );
      const pendingDays = pendingApplications.reduce((total, app) => {
        const start = new Date(app.fromDate);
        const end = new Date(app.toDate);
        const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return total + (app.isHalfDay ? days * 0.5 : days);
      }, 0);
      
      // Calculate remaining days
      const remainingDays = allocatedDays - usedDays - pendingDays;
      
      // Add to totals
      totalAllocated += allocatedDays;
      totalUsed += usedDays;
      totalPending += pendingDays;
      totalRemaining += remainingDays;
      
      return {
        leaveType,
        allocated: allocatedDays,
        used: usedDays,
        pending: pendingDays,
        remaining: remainingDays
      };
    });
    
    return {
      allocations: allocationSummary,
      totalAllocated,
      totalUsed,
      totalPending,
      totalRemaining
    };
  }

  // Summary methods
  async getEmployeeTimeSummary(employeeId: number): Promise<{
    todayHours: number;
    weekTotal: number;
    dailyDiff: number;
    topProject: { name: string; hours: number };
  }> {
    // Get today's date in YYYY-MM-DD format
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    
    // Today's hours
    const todayEntries = await this.getTimeEntriesByDate(employeeId, today);
    const todayHours = todayEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    
    // Yesterday's hours
    const yesterdayEntries = await this.getTimeEntriesByDate(employeeId, yesterday);
    const yesterdayHours = yesterdayEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    
    // Daily difference
    const dailyDiff = todayHours - yesterdayHours;
    
    // Get current week (past 7 days)
    const weekEnd = today;
    const weekStart = format(new Date(Date.now() - 6 * 86400000), "yyyy-MM-dd");
    const weekEntries = await this.getTimeEntriesForWeek(employeeId, weekStart, weekEnd);
    const weekTotal = weekEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    
    // Calculate top project
    const projectHours = new Map<number, number>();
    weekEntries.forEach(entry => {
      const current = projectHours.get(entry.projectId) || 0;
      projectHours.set(entry.projectId, current + Number(entry.hours));
    });
    
    let topProjectId = 0;
    let topProjectHours = 0;
    
    projectHours.forEach((hours, projectId) => {
      if (hours > topProjectHours) {
        topProjectId = projectId;
        topProjectHours = hours;
      }
    });
    
    const topProject = this.projects.get(topProjectId);
    
    return {
      todayHours,
      weekTotal,
      dailyDiff,
      topProject: {
        name: topProject ? topProject.name : 'None',
        hours: topProjectHours
      }
    };
  }

  // Seed data for demo purposes
  private seedData() {
    // Add demo employees
    const sarah = {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      password: "password123",
      employeeId: "EMP001",
      position: "Software Engineer",
      phone: "555-1234"
    };
    
    const john = {
      name: "John Smith",
      email: "john@example.com",
      password: "password123",
      employeeId: "EMP002",
      position: "UI Designer",
      phone: "555-5678"
    };
    
    this.createEmployee(sarah);
    this.createEmployee(john);
    
    // Add projects
    const projects = [
      { 
        name: "Website Redesign", 
        description: "Overhaul of company website", 
        active: true, 
        channelName: "project-website",
        channelId: "CH001",
        projectManagerEmail: "sarah@example.com",
        clientName: "Acme Corp",
        priority: "P1",
        budget: "$25,000"
      },
      { 
        name: "Mobile App", 
        description: "Mobile app development for clients", 
        active: true,
        channelName: "project-mobile",
        channelId: "CH002",
        projectManagerEmail: "john@example.com",
        clientName: "Beta Industries",
        priority: "P0",
        budget: "$120,000"
      },
      { 
        name: "Cloud Migration", 
        description: "Moving infrastructure to the cloud", 
        active: true,
        channelName: "project-cloud",
        channelId: "CH003",
        projectManagerEmail: "sarah@example.com",
        clientName: "Gamma Tech",
        priority: "P2",
        budget: "$80,000"
      },
      { 
        name: "Data Analysis", 
        description: "Quarterly data analysis project", 
        active: true,
        channelName: "project-data",
        channelId: "CH004",
        projectManagerEmail: "john@example.com",
        clientName: "Delta Systems",
        priority: "P3",
        budget: "$15,000"
      },
      { 
        name: "Internal Tools", 
        description: "Building internal productivity tools", 
        active: true,
        channelName: "project-internal",
        channelId: "CH005",
        projectManagerEmail: "sarah@example.com",
        clientName: "Internal",
        priority: "P2",
        budget: "$40,000"
      }
    ];
    
    projects.forEach(project => this.createProject(project));
    
    // Add time entries for Sarah (demo user)
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    const twoDaysAgo = format(new Date(Date.now() - 2 * 86400000), "yyyy-MM-dd");
    const threeDaysAgo = format(new Date(Date.now() - 3 * 86400000), "yyyy-MM-dd");
    
    const sarahEntries = [
      { date: today, hours: "3.5", description: "API integration for user authentication", employeeId: 1, projectId: 2 },
      { date: today, hours: "2", description: "Homepage responsive design fixes", employeeId: 1, projectId: 1 },
      { date: yesterday, hours: "4", description: "Quarterly data visualization", employeeId: 1, projectId: 4 },
      { date: yesterday, hours: "2.5", description: "UI components for settings screen", employeeId: 1, projectId: 2 },
      { date: twoDaysAgo, hours: "5", description: "Server configuration and database migration", employeeId: 1, projectId: 3 },
      { date: twoDaysAgo, hours: "1.5", description: "Client meeting and requirements gathering", employeeId: 1, projectId: 1 },
      { date: threeDaysAgo, hours: "3", description: "Building analytics dashboard", employeeId: 1, projectId: 4 },
      { date: threeDaysAgo, hours: "4", description: "Mobile app navigation implementation", employeeId: 1, projectId: 2 }
    ];
    
    sarahEntries.forEach(entry => this.createTimeEntry(entry));
    
    // Add leave types
    const leaveTypes = [
      { name: "Annual Leave", description: "Regular vacation time", color: "#10B981" },
      { name: "Sick Leave", description: "Time off due to illness", color: "#EF4444" },
      { name: "Personal Leave", description: "Time off for personal matters", color: "#F59E0B" },
      { name: "Maternity/Paternity Leave", description: "Leave for new parents", color: "#8B5CF6" },
      { name: "Bereavement Leave", description: "Leave due to death in family", color: "#6B7280" }
    ];
    
    leaveTypes.forEach(type => this.createLeaveType(type));
    
    // Add leave allocations for Sarah (demo user)
    const sarahAllocations = [
      { employeeId: 1, leaveTypeId: 1, allocatedDays: "21", year: 2025 }, // Annual Leave
      { employeeId: 1, leaveTypeId: 2, allocatedDays: "10", year: 2025 }, // Sick Leave
      { employeeId: 1, leaveTypeId: 3, allocatedDays: "5", year: 2025 },  // Personal Leave
      { employeeId: 1, leaveTypeId: 4, allocatedDays: "0", year: 2025 },  // Maternity/Paternity Leave
      { employeeId: 1, leaveTypeId: 5, allocatedDays: "3", year: 2025 }   // Bereavement Leave
    ];
    
    sarahAllocations.forEach(allocation => this.createLeaveAllocation(allocation));
    
    // Add a few leave applications for Sarah
    const leaveStart = new Date();
    leaveStart.setDate(leaveStart.getDate() + 10); // 10 days from now
    
    const leaveEnd = new Date(leaveStart);
    leaveEnd.setDate(leaveEnd.getDate() + 4); // 5 day leave
    
    const sarahLeaves = [
      { 
        employeeId: 1, 
        leaveTypeId: 1, 
        fromDate: format(leaveStart, "yyyy-MM-dd"), 
        toDate: format(leaveEnd, "yyyy-MM-dd"), 
        reason: "Family vacation", 
        status: "pending", 
        isHalfDay: false 
      },
      { 
        employeeId: 1, 
        leaveTypeId: 2, 
        fromDate: format(new Date(Date.now() - 15 * 86400000), "yyyy-MM-dd"), // 15 days ago
        toDate: format(new Date(Date.now() - 13 * 86400000), "yyyy-MM-dd"),   // 13 days ago
        reason: "Flu", 
        status: "approved", 
        isHalfDay: false 
      },
      { 
        employeeId: 1, 
        leaveTypeId: 3, 
        fromDate: format(new Date(Date.now() + 20 * 86400000), "yyyy-MM-dd"), // 20 days from now
        toDate: format(new Date(Date.now() + 20 * 86400000), "yyyy-MM-dd"),   // Same day
        reason: "Personal appointment", 
        status: "pending", 
        isHalfDay: true 
      }
    ];
    
    sarahLeaves.forEach(leave => this.createLeaveApplication(leave));
  }
}

export const storage = new MemStorage();
