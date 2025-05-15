import React from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import NavBar from "@/components/layout/Navbar";
import Home from "@/pages/home";
import Subjects from "@/pages/subjects";
import Chapters from "@/pages/chapters";
import Subchapters from "@/pages/subchapters";
import StudyMaterials from "@/pages/study-materials";
import Quiz from "@/pages/quiz";
import QuizResults from "@/pages/quiz-results";
import Leaderboard from "@/pages/leaderboard";
import StudentReport from "@/pages/student-report";
import AdminDashboard from "@/pages/admin/dashboard";
import ManageMaterials from "@/pages/admin/manage-materials";
import ManageSubjects from "@/pages/admin/manage-subjects";
import ManageChapters from "@/pages/admin/manage-chapters";
import ManageSubchapters from "@/pages/admin/manage-subchapters";
import ViewSubjects from "@/pages/admin/view-subjects";
import ViewChapters from "@/pages/admin/view-chapters";
import ViewSubchapters from "@/pages/admin/view-subchapters";
import ViewStudyMaterials from "@/pages/admin/view-study-materials";
import ManageUsers from "@/pages/admin/manage-users";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import { DjangoAuthProvider, useDjangoAuth } from "@/hooks/use-django-auth";
import { OpenAIStatusProvider } from "@/hooks/use-openai-status";

// Re-export useDjangoAuth as useAuth for compatibility with existing components
export const useAuth = useDjangoAuth;

// Protected route component
function ProtectedRoute({ component: Component, teacherOnly = false }: { 
  component: React.ComponentType;
  teacherOnly?: boolean;
}) {
  const { user, isLoading } = useDjangoAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        navigate("/login");
      } else if (teacherOnly && !(user.is_teacher || user.isTeacher)) {
        // Redirect students trying to access teacher-only pages
        navigate("/subjects");
        
        // Show a toast notification instead of an alert
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin area. Please contact your teacher if you believe this is an error.",
          variant: "destructive",
          duration: 5000
        });
      }
    }
  }, [user, isLoading, navigate, teacherOnly, toast]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Don't render the component if:
  // 1. User isn't logged in, or
  // 2. User is a student trying to access a teacher-only page
  if (!user || (teacherOnly && !(user.is_teacher || user.isTeacher))) {
    return null;
  }
  
  return <Component />;
}

function Router() {
  const { user } = useDjangoAuth();
  
  return (
    <div className="font-nunito">
      <NavBar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Protected student routes */}
        <Route path="/subjects">
          <ProtectedRoute component={Subjects} />
        </Route>
        <Route path="/subjects/:subjectId/chapters">
          <ProtectedRoute component={Chapters} />
        </Route>
        <Route path="/subjects/:subjectId/chapters/:chapterId/subchapters">
          <ProtectedRoute component={Subchapters} />
        </Route>
        <Route path="/subjects/:subjectId/chapters/:chapterId/subchapters/:subchapterId/materials">
          <ProtectedRoute component={StudyMaterials} />
        </Route>
        <Route path="/quiz/:materialId/:level">
          <ProtectedRoute component={Quiz} />
        </Route>
        <Route path="/results/:quizId">
          <ProtectedRoute component={QuizResults} />
        </Route>
        <Route path="/leaderboard/material/:materialId">
          <ProtectedRoute component={Leaderboard} />
        </Route>
        <Route path="/student-report">
          <ProtectedRoute component={StudentReport} />
        </Route>
        
        {/* Protected teacher routes - correctly redirects students */}
        <Route path="/admin/dashboard">
          <ProtectedRoute component={AdminDashboard} teacherOnly={true} />
        </Route>
        <Route path="/admin/materials">
          <ProtectedRoute component={ManageMaterials} teacherOnly={true} />
        </Route>
        <Route path="/admin/manage-subjects">
          <ProtectedRoute component={ManageSubjects} teacherOnly={true} />
        </Route>
        <Route path="/admin/subjects/:subjectId/chapters">
          <ProtectedRoute component={ManageChapters} teacherOnly={true} />
        </Route>
        <Route path="/admin/chapters/:chapterId/subchapters">
          <ProtectedRoute component={ManageSubchapters} teacherOnly={true} />
        </Route>
        <Route path="/admin/users">
          <ProtectedRoute component={ManageUsers} teacherOnly={true} />
        </Route>
        
        {/* Teacher view-only routes (without quiz options) */}
        <Route path="/admin/view-subjects">
          <ProtectedRoute component={ViewSubjects} teacherOnly={true} />
        </Route>
        <Route path="/admin/view/:subjectId/chapters">
          <ProtectedRoute component={ViewChapters} teacherOnly={true} />
        </Route>
        <Route path="/admin/view/:subjectId/chapters/:chapterId/subchapters">
          <ProtectedRoute component={ViewSubchapters} teacherOnly={true} />
        </Route>
        <Route path="/admin/view/:subjectId/chapters/:chapterId/subchapters/:subchapterId/materials">
          <ProtectedRoute component={ViewStudyMaterials} teacherOnly={true} />
        </Route>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  // Add font loading in the App component
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    // Load Material Icons
    const iconLink = document.createElement("link");
    iconLink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    iconLink.rel = "stylesheet";
    document.head.appendChild(iconLink);
    
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(iconLink);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DjangoAuthProvider>
        <Router />
        <Toaster />
      </DjangoAuthProvider>
    </QueryClientProvider>
  );
}

export default App;