import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { StudyMaterial, Subchapter } from "@shared/schema";
import { Sidebar } from "@/components/ui/sidebar";
import { ArrowLeft } from "lucide-react";

export default function ViewStudyMaterials() {
  const [, params] = useRoute("/admin/view/:subjectId/chapters/:chapterId/subchapters/:subchapterId/materials");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const subjectId = Number(params?.subjectId);
  const chapterId = Number(params?.chapterId);
  const subchapterId = Number(params?.subchapterId);
  
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [fileContent, setFileContent] = useState<string>(""); // In a real app, this would be PDF/DOCX content
  
  const { data: subchapter, isLoading: isLoadingSubchapter } = useQuery<Subchapter>({
    queryKey: [`/api/subchapters/${subchapterId}`],
    enabled: !isNaN(subchapterId)
  });
  
  const { data: materials, isLoading: isLoadingMaterials, error } = useQuery<StudyMaterial[]>({
    queryKey: [`/api/materials?subchapterId=${subchapterId}`],
    enabled: !isNaN(subchapterId)
  });
  
  useEffect(() => {
    if (materials && materials.length > 0 && !selectedMaterial) {
      setSelectedMaterial(materials[0]);
    }
  }, [materials, selectedMaterial]);
  
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
  
  const isLoading = isLoadingSubchapter || isLoadingMaterials;
  const subchapterName = subchapter?.name || "Loading...";
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block w-64 min-h-screen" />
      
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Link href={`/admin/view/${subjectId}/chapters/${chapterId}/subchapters`}>
              <Button variant="outline" size="icon" className="mr-4 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Subchapter: {subchapterName}</h1>
              <p className="text-gray-600 mt-1">Study materials</p>
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
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Material Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedMaterial ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Title</h3>
                          <p className="mt-1">{selectedMaterial.title}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">File Type</h3>
                          <p className="mt-1">{selectedMaterial.fileType}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">File Size</h3>
                          <p className="mt-1">{selectedMaterial.fileSize}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Uploaded On</h3>
                          <p className="mt-1">
                            {new Date(selectedMaterial.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Description</h3>
                          <p className="mt-1">{selectedMaterial.description || "No description available."}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">Select a material to view details</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedMaterial ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Total Quiz Attempts</h3>
                          <p className="mt-1 text-2xl font-bold">24</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
                          <p className="mt-1 text-2xl font-bold text-green-600">78%</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Difficulty Breakdown</h3>
                          <div className="mt-2 space-y-2">
                            <div className="flex justify-between items-center">
                              <span>Beginner</span>
                              <span className="font-medium">12 attempts</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Intermediate</span>
                              <span className="font-medium">8 attempts</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Advanced</span>
                              <span className="font-medium">4 attempts</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          className="w-full"
                          variant="outline"
                          onClick={() => navigate(`/admin/analytics/material/${selectedMaterial.id}`)}
                        >
                          <span className="material-icons mr-2">analytics</span>
                          View Detailed Analytics
                        </Button>
                      </div>
                    ) : (
                      <p className="text-gray-600">Select a material to view quiz statistics</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}