import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">TimeTrack</h1>
        <p className="text-muted-foreground mt-2">Employee Time Tracking System</p>
      </div>
      
      <LoginForm />
    </div>
  );
}
