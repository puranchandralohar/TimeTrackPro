import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertEmployeeSchema, insertTimeEntrySchema, insertProjectSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware for validation errors
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    
    console.error("Unexpected error:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  };

  // ------ AUTH ROUTES ------
  
  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }).parse(req.body);
      
      const employee = await storage.getEmployeeByEmail(email);
      
      if (!employee || employee.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // In a real app, we would set a session cookie here
      // For simplicity, we'll just return the employee data
      const { password: _, ...employeeWithoutPassword } = employee;
      
      res.status(200).json(employeeWithoutPassword);
    } catch (error) {
      return handleZodError(error, res);
    }
  });
  
  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    // In a real app, we would get the user from the session
    // For simplicity, we'll just return the first employee
    const employee = await storage.getEmployee(1);
    
    if (!employee) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { password: _, ...employeeWithoutPassword } = employee;
    res.status(200).json(employeeWithoutPassword);
  });
  
  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // In a real app, we would clear the session
    res.status(200).json({ message: "Logged out successfully" });
  });
  
  // ------ EMPLOYEE ROUTES ------
  
  // Get employee by ID
  app.get("/api/employees/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    
    const employee = await storage.getEmployee(id);
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    const { password: _, ...employeeWithoutPassword } = employee;
    res.status(200).json(employeeWithoutPassword);
  });
  
  // Update employee
  app.put("/api/employees/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Validate and update
      const updateSchema = insertEmployeeSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const updatedEmployee = await storage.updateEmployee(id, updateData);
      
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const { password: _, ...employeeWithoutPassword } = updatedEmployee;
      res.status(200).json(employeeWithoutPassword);
    } catch (error) {
      return handleZodError(error, res);
    }
  });
  
  // ------ PROJECT ROUTES ------
  
  // Get all projects
  app.get("/api/projects", async (req: Request, res: Response) => {
    const projects = await storage.getProjects();
    res.status(200).json(projects);
  });
  
  // Get project by ID
  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const project = await storage.getProject(id);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.status(200).json(project);
  });
  
  // Create new project
  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      return handleZodError(error, res);
    }
  });
  
  // Update project
  app.put("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Validate and update
      const updateSchema = insertProjectSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      // For now, we'll just create an updateProject method in the interface
      // that forwards to createProject with an ID
      const updatedProject = {
        ...project,
        ...updateData
      };
      
      await storage.createProject(updatedProject);
      res.status(200).json(updatedProject);
    } catch (error) {
      return handleZodError(error, res);
    }
  });
  
  // ------ TIME ENTRY ROUTES ------
  
  // Get time entries for employee
  app.get("/api/time-entries", async (req: Request, res: Response) => {
    // In a real app, we would get the employee ID from the session
    // or from a query parameter
    const employeeId = parseInt(req.query.employeeId as string) || 1;
    
    const timeEntries = await storage.getTimeEntriesByEmployee(employeeId);
    res.status(200).json(timeEntries);
  });
  
  // Get time entry by ID
  app.get("/api/time-entries/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid time entry ID" });
    }
    
    const timeEntry = await storage.getTimeEntry(id);
    
    if (!timeEntry) {
      return res.status(404).json({ message: "Time entry not found" });
    }
    
    res.status(200).json(timeEntry);
  });
  
  // Create time entry
  app.post("/api/time-entries", async (req: Request, res: Response) => {
    try {
      // Ensure date is in YYYY-MM-DD format
      if (req.body.date && typeof req.body.date === 'string') {
        try {
          const date = new Date(req.body.date);
          req.body.date = format(date, "yyyy-MM-dd");
        } catch (error) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }
      
      // Ensure projectId is a number
      if (req.body.projectId && typeof req.body.projectId === 'string') {
        req.body.projectId = parseInt(req.body.projectId);
      }
      
      // Validate data
      const timeEntryData = insertTimeEntrySchema.parse(req.body);
      
      // Create time entry
      const timeEntry = await storage.createTimeEntry(timeEntryData);
      res.status(201).json(timeEntry);
    } catch (error) {
      return handleZodError(error, res);
    }
  });
  
  // Update time entry
  app.put("/api/time-entries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid time entry ID" });
      }
      
      const timeEntry = await storage.getTimeEntry(id);
      
      if (!timeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      // Ensure date is in YYYY-MM-DD format if provided
      if (req.body.date && typeof req.body.date === 'string') {
        try {
          const date = new Date(req.body.date);
          req.body.date = format(date, "yyyy-MM-dd");
        } catch (error) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }
      
      // Ensure projectId is a number if provided
      if (req.body.projectId && typeof req.body.projectId === 'string') {
        req.body.projectId = parseInt(req.body.projectId);
      }
      
      // Validate and update
      const updateSchema = insertTimeEntrySchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const updatedTimeEntry = await storage.updateTimeEntry(id, updateData);
      
      if (!updatedTimeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      res.status(200).json(updatedTimeEntry);
    } catch (error) {
      return handleZodError(error, res);
    }
  });
  
  // Delete time entry
  app.delete("/api/time-entries/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid time entry ID" });
    }
    
    const timeEntry = await storage.getTimeEntry(id);
    
    if (!timeEntry) {
      return res.status(404).json({ message: "Time entry not found" });
    }
    
    const deleted = await storage.deleteTimeEntry(id);
    
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete time entry" });
    }
    
    res.status(200).json({ message: "Time entry deleted successfully" });
  });
  
  // ------ SUMMARY ROUTES ------
  
  // Get time entry summary for employee
  app.get("/api/time-entries/summary", async (req: Request, res: Response) => {
    // In a real app, we would get the employee ID from the session
    // or from a query parameter
    const employeeId = parseInt(req.query.employeeId as string) || 1;
    
    const summary = await storage.getEmployeeTimeSummary(employeeId);
    res.status(200).json(summary);
  });

  const httpServer = createServer(app);
  return httpServer;
}
