import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Chapter, Subject } from "@shared/schema";

interface ChapterCardProps {
  chapter: Chapter;
  index: number;
  onClick: () => void;
}

function ChapterCard({ chapter, index, onClick }: ChapterCardProps) {
  // Mock completion data (in a real app, this would come from the API)
  const completionRate = Math.floor(Math.random() * 100);
  
  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border-2 border-transparent hover:border-primary"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-lg text-primary">Chapter {index + 1}</span>
          <div className="bg-primary/20 text-primary text-xs py-1 px-3 rounded-full">
            <span>{completionRate}%</span> complete
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{chapter.name}</h3>
        
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full" 
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default function Chapters() {
  const [, params] = useRoute("/subjects/:subjectId/chapters");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const subjectId = Number(params?.subjectId);
  
  const { data: subject, isLoading: isLoadingSubject } = useQuery<Subject>({
    queryKey: [`/api/subjects/${subjectId}`],
    enabled: !isNaN(subjectId)
  });
  
  const { data: chapters, isLoading: isLoadingChapters, error } = useQuery<Chapter[]>({
    queryKey: [`/api/chapters?subjectId=${subjectId}`],
    enabled: !isNaN(subjectId)
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load chapters. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  const handleChapterClick = (chapterId: number) => {
    navigate(`/subjects/${subjectId}/chapters/${chapterId}/subchapters`);
  };
  
  const isLoading = isLoadingSubject || isLoadingChapters;
  const subjectName = subject?.name || "Loading...";
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <Link href="/subjects">
          <Button variant="outline" size="icon" className="mr-4 rounded-full">
            <span className="material-icons text-primary">arrow_back</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{subjectName}</h1>
          <p className="text-gray-600 mt-1">Select a chapter to continue</p>
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
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-2.5 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : chapters && chapters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map((chapter, index) => (
            <ChapterCard 
              key={chapter.id} 
              chapter={chapter}
              index={index}
              onClick={() => handleChapterClick(chapter.id)} 
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <span className="material-icons text-4xl text-gray-400">book</span>
            <p className="text-gray-600 mt-2">No chapters available for this subject yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
