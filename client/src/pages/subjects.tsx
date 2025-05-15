import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Subject } from "@shared/schema";

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
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border-2 border-transparent hover:border-primary"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <span className="material-icons text-3xl text-primary">{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-center text-gray-800">{subject.name}</h3>
      </div>
    </div>
  );
}

export default function Subjects() {
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
    navigate(`/subjects/${subjectId}/chapters`);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Choose a Subject</h1>
        <p className="text-gray-600 mt-2">Select a subject to start learning</p>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mx-auto w-24"></div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
