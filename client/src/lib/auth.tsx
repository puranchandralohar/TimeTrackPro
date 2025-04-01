import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Employee } from "@shared/schema";
import { apiRequest, queryClient } from "./queryClient";

interface AuthContextType {
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (employee: Employee) => void;
  logout: () => void;
  updateEmployee: (employee: Employee) => void;
}

const AuthContext = createContext<AuthContextType>({
  employee: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateEmployee: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setEmployee(data);
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = (userData: Employee) => {
    setEmployee(userData);
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
    } catch (error) {
      console.error("Failed to logout", error);
    } finally {
      // Always clear state even if request fails
      setEmployee(null);
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  const updateEmployee = (updatedEmployee: Employee) => {
    setEmployee(updatedEmployee);
  };

  return (
    <AuthContext.Provider
      value={{
        employee,
        isAuthenticated: !!employee,
        isLoading,
        login,
        logout,
        updateEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
