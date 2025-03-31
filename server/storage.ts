import { 
  employees, type Employee, type InsertEmployee,
  projects, type Project, type InsertProject,
  timeEntries, type TimeEntry, type InsertTimeEntry
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
  private employeeIdCounter: number;
  private projectIdCounter: number;
  private timeEntryIdCounter: number;

  constructor() {
    this.employees = new Map();
    this.projects = new Map();
    this.timeEntries = new Map();
    this.employeeIdCounter = 1;
    this.projectIdCounter = 1;
    this.timeEntryIdCounter = 1;
    
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
      ...insertProject, 
      id, 
      description: insertProject.description || null,
      active: insertProject.active === undefined ? true : insertProject.active
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
      { name: "Website Redesign", description: "Overhaul of company website", active: true },
      { name: "Mobile App", description: "Mobile app development for clients", active: true },
      { name: "Cloud Migration", description: "Moving infrastructure to the cloud", active: true },
      { name: "Data Analysis", description: "Quarterly data analysis project", active: true },
      { name: "Internal Tools", description: "Building internal productivity tools", active: true }
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
  }
}

export const storage = new MemStorage();
