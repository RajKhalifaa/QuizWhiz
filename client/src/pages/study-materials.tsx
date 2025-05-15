import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { StudyMaterial, Subchapter } from "@shared/schema";
import { useAuth } from "@/App";

export default function StudyMaterials() {
  const [, params] = useRoute("/subjects/:subjectId/chapters/:chapterId/subchapters/:subchapterId/materials");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const subjectId = Number(params?.subjectId);
  const chapterId = Number(params?.chapterId);
  const subchapterId = Number(params?.subchapterId);
  
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>(""); // In a real app, this would be PDF/DOCX content
  
  const { data: subchapter, isLoading: isLoadingSubchapter } = useQuery<Subchapter>({
    queryKey: [`/api/subchapters/${subchapterId}`],
    enabled: !isNaN(subchapterId)
  });
  
  const { data: materials, isLoading: isLoadingMaterials, error } = useQuery<StudyMaterial[]>({
    queryKey: [`/api/materials?subchapterId=${subchapterId}`],
    enabled: !isNaN(subchapterId),
    onSuccess: (data) => {
      if (data.length > 0 && !selectedMaterial) {
        setSelectedMaterial(data[0]);
      }
    }
  });
  
  const generateQuizMutation = useMutation({
    mutationFn: async ({ materialId, level }: { materialId: number, level: string }) => {
      const response = await apiRequest("POST", `/api/generate-quiz/${materialId}`, { level });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Quiz generated successfully!"
      });
      navigate(`/quiz/${selectedMaterial?.id}/${selectedDifficulty}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load study materials. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  const handleMaterialSelect = (material: StudyMaterial) => {
    setSelectedMaterial(material);
    // In a real app, you would fetch the file content here
    setFileContent(`This is the content of ${material.title}.`);
  };
  
  const handleGenerateQuiz = () => {
    if (!selectedMaterial || !selectedDifficulty) {
      toast({
        title: "Warning",
        description: "Please select a difficulty level first.",
        variant: "destructive"
      });
      return;
    }
    
    generateQuizMutation.mutate({
      materialId: selectedMaterial.id,
      level: selectedDifficulty
    });
  };
  
  const isLoading = isLoadingSubchapter || isLoadingMaterials;
  const subchapterName = subchapter?.name || "Loading...";
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/subjects/${subjectId}/chapters/${chapterId}/subchapters`}>
          <Button variant="outline" size="icon" className="mr-4 rounded-full">
            <span className="material-icons text-primary">arrow_back</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subchapter: {subchapterName}</h1>
          <p className="text-gray-600 mt-1">Study materials and take a quiz</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-80 bg-gray-200 rounded-xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area (col-span-2) */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Study Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materials && materials.length > 0 ? (
                    materials.map((material) => (
                      <div 
                        key={material.id}
                        className={`border border-border rounded-lg p-4 hover:bg-primary/10 transition-colors cursor-pointer ${
                          selectedMaterial?.id === material.id ? 'bg-primary/10 border-primary' : ''
                        }`}
                        onClick={() => handleMaterialSelect(material)}
                      >
                        <div className="flex items-start">
                          <div className="bg-primary p-2 rounded text-white mr-4">
                            <span className="material-icons">description</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800">{material.title}</h3>
                            <p className="text-gray-600 text-sm">{material.description || "No description available."}</p>
                            <div className="mt-2 flex items-center">
                              <span className="text-xs text-gray-500">
                                {material.fileType} • {material.fileSize} • 
                                {new Date(material.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <span className="material-icons text-4xl text-gray-400">description</span>
                      <p className="text-gray-600 mt-2">No study materials available for this subchapter.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Material Content Viewer */}
            {selectedMaterial && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>{selectedMaterial.title}</CardTitle>
                  <Button variant="ghost" size="icon">
                    <span className="material-icons">fullscreen</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-border rounded-lg p-4 h-96 overflow-y-auto">
                    {/* PDF/Document Viewer Placeholder */}
                    <div className="flex flex-col items-center justify-center h-full">
                      {fileContent ? (
                        <>
                          <img 
                            src="https://images.unsplash.com/photo-1513358130276-442a18340285?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                            alt="Plant diagram" 
                            className="w-full h-auto rounded-lg mb-4"
                          />
                          
                          <h3 className="text-lg font-bold">Types of Plants</h3>
                          <p className="text-center text-gray-600 mt-2">
                            Plants are living things that grow in the earth and need sun and water to live. 
                            Plants can be big or small. Some plants give us food to eat like vegetables and fruits.
                          </p>
                          
                          <div className="mt-4 w-full">
                            <h4 className="font-bold">Two Main Types of Plants:</h4>
                            <ul className="list-disc list-inside mt-2">
                              <li className="mb-2">Flowering plants - Plants that make flowers and fruits</li>
                              <li className="mb-2">Non-flowering plants - Plants that don't make flowers</li>
                            </ul>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <span className="material-icons text-4xl text-gray-400">description</span>
                          <p className="text-gray-600 mt-2">Select a study material to view its content.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar (col-span-1) */}
          <div className="lg:col-span-1">
            {/* Quiz generation card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Test Your Knowledge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Generate a quiz based on the study materials to test what you've learned.
                </p>
                
                <h3 className="font-bold text-gray-800 mb-2">Select Difficulty:</h3>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <Button 
                    variant={selectedDifficulty === "Beginner" ? "default" : "outline"}
                    className={selectedDifficulty === "Beginner" ? "bg-primary text-white" : "bg-primary/10 text-primary"}
                    onClick={() => setSelectedDifficulty("Beginner")}
                  >
                    Beginner
                  </Button>
                  <Button 
                    variant={selectedDifficulty === "Intermediate" ? "default" : "outline"}
                    className={selectedDifficulty === "Intermediate" ? "bg-primary text-white" : "bg-primary/10 text-primary"}
                    onClick={() => setSelectedDifficulty("Intermediate")}
                  >
                    Intermediate
                  </Button>
                  <Button 
                    variant={selectedDifficulty === "Advanced" ? "default" : "outline"}
                    className={selectedDifficulty === "Advanced" ? "bg-primary text-white" : "bg-primary/10 text-primary"}
                    onClick={() => setSelectedDifficulty("Advanced")}
                  >
                    Advanced
                  </Button>
                </div>
                
                <Button 
                  className="w-full bg-secondary text-white hover:bg-secondary/90"
                  onClick={handleGenerateQuiz}
                  disabled={!selectedMaterial || !selectedDifficulty || generateQuizMutation.isPending}
                >
                  <span className="material-icons mr-2">quiz</span>
                  {generateQuizMutation.isPending ? "Generating..." : "Generate Quiz"}
                </Button>
              </CardContent>
            </Card>
            
            {/* Previous results card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Previous Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* This would be populated from the API in a real app */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Beginner</span>
                      <span className="text-[#66BB6A] font-bold">80%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div className="bg-[#66BB6A] h-2.5 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Completed on 18 Aug 2023 • 3 min 45 sec</p>
                  </div>
                  
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Intermediate</span>
                      <span className="text-[#FFCA28] font-bold">65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div className="bg-[#FFCA28] h-2.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Completed on 20 Aug 2023 • 5 min 12 sec</p>
                  </div>
                  
                  <Link href={`/leaderboard/material/${selectedMaterial?.id}`} className="block text-center text-primary font-bold hover:underline mt-4">
                    View All Results
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
