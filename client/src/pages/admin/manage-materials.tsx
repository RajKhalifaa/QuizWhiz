import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/timeUtils";
import { useAuth } from "@/App";
import { Sidebar } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Subject, Chapter, Subchapter } from "@shared/schema";

interface StudyMaterial {
  id: number;
  title: string;
  description: string | null;
  documentUrl: string;
  fileType: string;
  fileSize: string;
  subchapterId: number;
  createdAt: string;
}

export default function ManageMaterials() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [selectedSubchapterId, setSelectedSubchapterId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<StudyMaterial | null>(null);
  
  useEffect(() => {
    // Redirect non-teachers
    if (user && !user.isTeacher) {
      navigate("/subjects");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin area.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);
  
  // Fetch subjects, chapters, subchapters, and materials
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });
  
  const { data: chapters } = useQuery<Chapter[]>({
    queryKey: [`/api/chapters?subjectId=${selectedSubjectId}`],
    enabled: !!selectedSubjectId,
  });
  
  const { data: subchapters } = useQuery<Subchapter[]>({
    queryKey: [`/api/subchapters?chapterId=${selectedChapterId}`],
    enabled: !!selectedChapterId,
  });
  
  // Just show all materials for now
  const { data: materials, isLoading } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/materials"],
  });
  
  const uploadMaterialMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Get token from localStorage
      const token = localStorage.getItem('djangoAuthToken');
      
      const response = await fetch("/api/materials", {
        method: "POST",
        body: formData,
        headers: {
          // Don't include Content-Type with FormData
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload material: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsUploadDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({
        title: "Success",
        description: "Study material uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload material. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: number) => {
      await apiRequest("DELETE", `/api/materials/${materialId}`);
    },
    onSuccess: () => {
      setMaterialToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({
        title: "Success",
        description: "Study material deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete material. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setSelectedSubjectId(null);
    setSelectedChapterId(null);
    setSelectedSubchapterId(null);
  };
  
  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !selectedSubchapterId || !file) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select a file.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("subchapterId", String(selectedSubchapterId));
    formData.append("document", file);
    
    uploadMaterialMutation.mutate(formData);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "picture_as_pdf";
    if (fileType.includes("word") || fileType.includes("docx")) return "description";
    if (fileType.includes("image")) return "image";
    return "insert_drive_file";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block w-64 min-h-screen" />
      
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Manage Study Materials</h1>
            
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <span className="material-icons mr-2">add</span>
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload Study Material</DialogTitle>
                  <DialogDescription>
                    Upload a new study material for students. Supported formats: PDF, DOCX.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleUpload} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter material title"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter a brief description (optional)"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={selectedSubjectId?.toString() || ""}
                      onValueChange={(value) => {
                        setSelectedSubjectId(Number(value));
                        setSelectedChapterId(null);
                        setSelectedSubchapterId(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chapter">Chapter</Label>
                    <Select
                      value={selectedChapterId?.toString() || ""}
                      onValueChange={(value) => {
                        setSelectedChapterId(Number(value));
                        setSelectedSubchapterId(null);
                      }}
                      disabled={!selectedSubjectId || !chapters?.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters?.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id.toString()}>
                            {chapter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subchapter">Subchapter</Label>
                    <Select
                      value={selectedSubchapterId?.toString() || ""}
                      onValueChange={(value) => setSelectedSubchapterId(Number(value))}
                      disabled={!selectedChapterId || !subchapters?.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subchapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {subchapters?.map((subchapter) => (
                          <SelectItem key={subchapter.id} value={subchapter.id.toString()}>
                            {subchapter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="file">Upload File</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer" onClick={() => document.getElementById("file")?.click()}>
                      <input
                        type="file"
                        id="file"
                        className="hidden"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                      />
                      <span className="material-icons text-4xl text-gray-400">cloud_upload</span>
                      <p className="text-gray-600 mt-2">{file ? file.name : "Drag & drop or click to upload"}</p>
                      <p className="text-xs text-gray-500 mt-1">Supports PDF, DOCX (Max 10MB)</p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsUploadDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-primary text-white hover:bg-primary/90"
                      disabled={uploadMaterialMutation.isPending}
                    >
                      {uploadMaterialMutation.isPending ? "Uploading..." : "Upload Material"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Study Materials</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : materials && materials.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Title</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Type</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Size</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Uploaded</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((material) => (
                        <tr key={material.id} className="border-b border-border">
                          <td className="px-3 py-3">
                            <div className="flex items-center">
                              <span className="material-icons text-primary mr-2">
                                {getFileTypeIcon(material.fileType)}
                              </span>
                              <div>
                                <span className="font-medium">{material.title}</span>
                                {material.description && (
                                  <p className="text-xs text-gray-500">{material.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                              {material.fileType.split('/')[1]?.toUpperCase() || material.fileType}
                            </span>
                          </td>
                          <td className="px-3 py-3">{material.fileSize}</td>
                          <td className="px-3 py-3">{formatDate(material.createdAt)}</td>
                          <td className="px-3 py-3">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded">
                                <span className="material-icons">edit</span>
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-destructive hover:bg-destructive/10 rounded"
                                    onClick={() => setMaterialToDelete(material)}
                                  >
                                    <span className="material-icons">delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Material</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{material.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => deleteMaterialMutation.mutate(material.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="material-icons text-6xl text-gray-400">description</span>
                  <p className="mt-4 text-lg text-gray-600">No study materials found.</p>
                  <p className="text-gray-600">Click the "Add Material" button to upload your first study material.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
