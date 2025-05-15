import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Subject } from "@shared/schema";
import { Sidebar } from "@/components/ui/sidebar";

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
}

function SubjectCard({ subject, onClick }: SubjectCardProps) {
  const icons: Record<string, string> = {
    "Mathematics": "calculate",
    "Science": "science",
    "Bahasa Malaysia": "language",
    "English": "menu_book"
  };
  
  const icon = icons[subject.name] || subject.icon || "school";
  
  return (
    <Card 
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <span className="material-icons text-3xl text-primary">{icon}</span>
          </div>
          <h3 className="text-xl font-bold text-center text-gray-800 mb-2">{subject.name}</h3>
          <p className="text-gray-600 text-center text-sm line-clamp-2">
            {subject.description || "No description available"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ViewSubjects() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: subjects, isLoading, error } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load subjects. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  const handleSubjectClick = (subjectId: number) => {
    navigate(`/admin/view/${subjectId}/chapters`);
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block w-64 min-h-screen" />
      
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">View Subjects</h1>
              <p className="text-gray-600 mt-1">Explore and manage educational subjects</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate("/admin/manage-subjects")}
            >
              <span className="material-icons mr-2">edit</span>
              Manage Subjects
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gray-200 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : subjects && subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subjects.map((subject) => (
                <SubjectCard 
                  key={subject.id} 
                  subject={subject} 
                  onClick={() => handleSubjectClick(subject.id)} 
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <span className="material-icons text-4xl text-gray-400">school</span>
                <p className="text-gray-600 mt-2">No subjects available. Please check back later.</p>
                <Button
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/admin/manage-subjects")}
                >
                  <span className="material-icons mr-2">add</span>
                  Add Subjects
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}