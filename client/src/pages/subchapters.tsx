import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Subchapter, Chapter } from "@shared/schema";

interface SubchapterCardProps {
  subchapter: Subchapter;
  index: number;
  onClick: () => void;
}

function SubchapterCard({ subchapter, index, onClick }: SubchapterCardProps) {
  // Mock status data (in a real app, this would come from the API)
  const statuses = ["completed", "in-progress", "not-started"];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  const statusConfig = {
    "completed": {
      icon: "check_circle",
      text: "Completed",
      color: "text-[#66BB6A]"
    },
    "in-progress": {
      icon: "play_circle",
      text: "In progress",
      color: "text-[#FFCA28]"
    },
    "not-started": {
      icon: "fiber_new",
      text: "Not started",
      color: "text-gray-500"
    }
  };
  
  const status = statusConfig[randomStatus];
  
  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border-2 border-transparent hover:border-primary"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-primary">Subchapter {index + 1}</span>
          <div className="bg-secondary/20 text-secondary text-xs py-1 px-3 rounded-full">
            {Math.floor(Math.random() * 5) + 1} materials
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{subchapter.name}</h3>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className={`material-icons mr-1 ${status.color}`}>{status.icon}</span>
            <span className={`text-sm ${status.color}`}>{status.text}</span>
          </div>
          <span className="material-icons text-primary">arrow_forward</span>
        </div>
      </div>
    </div>
  );
}

export default function Subchapters() {
  const [, params] = useRoute("/subjects/:subjectId/chapters/:chapterId/subchapters");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const subjectId = Number(params?.subjectId);
  const chapterId = Number(params?.chapterId);
  
  const { data: chapter, isLoading: isLoadingChapter } = useQuery<Chapter>({
    queryKey: [`/api/chapters/${chapterId}`],
    enabled: !isNaN(chapterId)
  });
  
  const { data: subchapters, isLoading: isLoadingSubchapters, error } = useQuery<Subchapter[]>({
    queryKey: [`/api/subchapters?chapterId=${chapterId}`],
    enabled: !isNaN(chapterId)
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load subchapters. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  const handleSubchapterClick = (subchapterId: number) => {
    navigate(`/subjects/${subjectId}/chapters/${chapterId}/subchapters/${subchapterId}/materials`);
  };
  
  const isLoading = isLoadingChapter || isLoadingSubchapters;
  const chapterName = chapter?.name || "Loading...";
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/subjects/${subjectId}/chapters`}>
          <Button variant="outline" size="icon" className="mr-4 rounded-full">
            <span className="material-icons text-primary">arrow_back</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chapter: {chapterName}</h1>
          <p className="text-gray-600 mt-1">Select a subchapter to study</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="mt-4 flex justify-between items-center">
                <div className="h-5 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-5"></div>
              </div>
            </div>
          ))}
        </div>
      ) : subchapters && subchapters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subchapters.map((subchapter, index) => (
            <SubchapterCard 
              key={subchapter.id} 
              subchapter={subchapter}
              index={index}
              onClick={() => handleSubchapterClick(subchapter.id)} 
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <span className="material-icons text-4xl text-gray-400">book</span>
            <p className="text-gray-600 mt-2">No subchapters available for this chapter yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
