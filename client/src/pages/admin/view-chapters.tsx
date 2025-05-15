import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Chapter, Subject } from "@shared/schema";
import { Sidebar } from "@/components/ui/sidebar";
import { ArrowLeft } from "lucide-react";

export default function ViewChapters() {
  const [, params] = useRoute("/admin/view/:subjectId/chapters");
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
    navigate(`/admin/view/${subjectId}/chapters/${chapterId}/subchapters`);
  };
  
  const isLoading = isLoadingSubject || isLoadingChapters;
  const subjectName = subject?.name || "Loading...";
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block w-64 min-h-screen" />
      
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Link href="/admin/view-subjects">
              <Button variant="outline" size="icon" className="mr-4 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{subjectName}</h1>
              <p className="text-gray-600 mt-1">View and manage chapters</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate(`/admin/subjects/${subjectId}/chapters`)}
            >
              <span className="material-icons mr-2">edit</span>
              Manage Chapters
            </Button>
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
              {chapters
                .sort((a, b) => (a.order || 1) - (b.order || 1))
                .map((chapter, index) => (
                <Card 
                  key={chapter.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleChapterClick(chapter.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Chapter {chapter.order || index + 1}</CardTitle>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">
                        {chapter.order || index + 1}
                      </span>
                    </div>
                    <CardDescription className="text-lg font-semibold text-gray-800">
                      {chapter.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {chapter.description || "No description available"}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500">
                        Click to view subchapters
                      </span>
                      <ArrowLeft className="h-4 w-4 transform rotate-180" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <span className="material-icons text-4xl text-gray-400">book</span>
                <p className="text-gray-600 mt-2">No chapters available for this subject yet.</p>
                <Button
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate(`/admin/subjects/${subjectId}/chapters`)}
                >
                  <span className="material-icons mr-2">add</span>
                  Add Chapters
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}