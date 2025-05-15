import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Subchapter, Chapter } from "@shared/schema";
import { Sidebar } from "@/components/ui/sidebar";
import { ArrowLeft } from "lucide-react";

export default function ViewSubchapters() {
  const [, params] = useRoute("/admin/view/:subjectId/chapters/:chapterId/subchapters");
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
    navigate(`/admin/view/${subjectId}/chapters/${chapterId}/subchapters/${subchapterId}/materials`);
  };
  
  const isLoading = isLoadingChapter || isLoadingSubchapters;
  const chapterName = chapter?.name || "Loading...";
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block w-64 min-h-screen" />
      
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Link href={`/admin/view/${subjectId}/chapters`}>
              <Button variant="outline" size="icon" className="mr-4 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Chapter: {chapterName}</h1>
              <p className="text-gray-600 mt-1">View and manage subchapters</p>
            </div>
            <div className="ml-auto">
              <Button 
                onClick={() => navigate(`/admin/chapters/${chapterId}/subchapters`)}
                variant="outline"
              >
                <span className="material-icons mr-2">edit</span>
                Manage Subchapters
              </Button>
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
              {subchapters
                .sort((a, b) => (a.order || 1) - (b.order || 1))
                .map((subchapter, index) => (
                <Card 
                  key={subchapter.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSubchapterClick(subchapter.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-xl">{subchapter.name}</CardTitle>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">
                        {subchapter.order || index + 1}
                      </span>
                    </div>
                    <CardDescription>
                      {subchapter.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Click to view materials
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
                <p className="text-gray-600 mt-2">No subchapters available for this chapter yet.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate(`/admin/chapters/${chapterId}/subchapters`)}
                >
                  <span className="material-icons mr-2">add</span>
                  Add Subchapters
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}