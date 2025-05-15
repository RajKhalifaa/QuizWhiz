import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { Sidebar } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Subject, Chapter } from "@shared/schema";

export default function ManageChapters() {
  const [, params] = useRoute("/admin/subjects/:subjectId/chapters");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const subjectId = Number(params?.subjectId);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [chapterName, setChapterName] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");
  const [chapterOrder, setChapterOrder] = useState(1);
  const [chapterToEdit, setChapterToEdit] = useState<Chapter | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  
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
  
  // Fetch subject
  const { data: subject, isLoading: isLoadingSubject } = useQuery<Subject>({
    queryKey: [`/api/subjects/${subjectId}`],
    enabled: !isNaN(subjectId),
  });
  
  // Fetch chapters
  const { data: chapters, isLoading: isLoadingChapters } = useQuery<Chapter[]>({
    queryKey: [`/api/chapters?subjectId=${subjectId}`],
    enabled: !isNaN(subjectId),
  });
  
  const addChapterMutation = useMutation({
    mutationFn: async (chapterData: { name: string; description: string; order: number; subjectId: number }) => {
      return await apiRequest("POST", "/api/chapters", chapterData);
    },
    onSuccess: () => {
      setIsAddDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: [`/api/chapters?subjectId=${subjectId}`] });
      toast({
        title: "Success",
        description: "Chapter added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add chapter. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const updateChapterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description: string; order: number; subjectId: number } }) => {
      return await apiRequest("PUT", `/api/chapters/${id}`, data);
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setChapterToEdit(null);
      queryClient.invalidateQueries({ queryKey: [`/api/chapters?subjectId=${subjectId}`] });
      toast({
        title: "Success",
        description: "Chapter updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update chapter. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: number) => {
      return await apiRequest("DELETE", `/api/chapters/${chapterId}`);
    },
    onSuccess: () => {
      setChapterToDelete(null);
      queryClient.invalidateQueries({ queryKey: [`/api/chapters?subjectId=${subjectId}`] });
      toast({
        title: "Success",
        description: "Chapter deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete chapter. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setChapterName("");
    setChapterDescription("");
    setChapterOrder(chapters?.length ? chapters.length + 1 : 1);
  };
  
  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chapterName) {
      toast({
        title: "Error",
        description: "Please enter a chapter name.",
        variant: "destructive",
      });
      return;
    }
    
    addChapterMutation.mutate({
      name: chapterName,
      description: chapterDescription,
      order: chapterOrder,
      subjectId,
    });
  };
  
  const handleEditChapter = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chapterName || !chapterToEdit) {
      toast({
        title: "Error",
        description: "Please enter a chapter name.",
        variant: "destructive",
      });
      return;
    }
    
    updateChapterMutation.mutate({
      id: chapterToEdit.id,
      data: {
        name: chapterName,
        description: chapterDescription,
        order: chapterOrder,
        subjectId,
      },
    });
  };
  
  const handleEditClick = (chapter: Chapter) => {
    setChapterToEdit(chapter);
    setChapterName(chapter.name);
    setChapterDescription(chapter.description || "");
    setChapterOrder(chapter.order || 1);
    setIsEditDialogOpen(true);
  };
  
  const handleManageSubchapters = (chapterId: number) => {
    navigate(`/admin/chapters/${chapterId}/subchapters`);
  };
  
  const isLoading = isLoadingSubject || isLoadingChapters;
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block w-64 min-h-screen" />
      
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              className="mr-4 rounded-full"
              onClick={() => navigate("/admin/manage-subjects")}
            >
              <span className="material-icons text-primary">arrow_back</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                Manage Chapters for {subject?.name || "Loading..."}
              </h1>
            </div>
            <Button 
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
            >
              <span className="material-icons mr-2">add</span>
              Add Chapter
            </Button>
          </div>
          
          {/* Add Chapter Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Chapter</DialogTitle>
                <DialogDescription>
                  Create a new chapter for the subject {subject?.name}.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddChapter}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="chapter-name">Chapter Name</Label>
                    <Input
                      id="chapter-name"
                      placeholder="Enter chapter name"
                      value={chapterName}
                      onChange={(e) => setChapterName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="chapter-description">Description (Optional)</Label>
                    <Textarea
                      id="chapter-description"
                      placeholder="Enter chapter description"
                      value={chapterDescription}
                      onChange={(e) => setChapterDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="chapter-order">Order</Label>
                    <Input
                      id="chapter-order"
                      type="number"
                      min="1"
                      placeholder="Enter chapter order"
                      value={chapterOrder}
                      onChange={(e) => setChapterOrder(Number(e.target.value))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-primary text-white hover:bg-primary/90"
                    disabled={addChapterMutation.isPending}
                  >
                    {addChapterMutation.isPending ? "Adding..." : "Add Chapter"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Chapter Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Chapter</DialogTitle>
                <DialogDescription>
                  Update the chapter details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditChapter}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-chapter-name">Chapter Name</Label>
                    <Input
                      id="edit-chapter-name"
                      placeholder="Enter chapter name"
                      value={chapterName}
                      onChange={(e) => setChapterName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-chapter-description">Description (Optional)</Label>
                    <Textarea
                      id="edit-chapter-description"
                      placeholder="Enter chapter description"
                      value={chapterDescription}
                      onChange={(e) => setChapterDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-chapter-order">Order</Label>
                    <Input
                      id="edit-chapter-order"
                      type="number"
                      min="1"
                      placeholder="Enter chapter order"
                      value={chapterOrder}
                      onChange={(e) => setChapterOrder(Number(e.target.value))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-primary text-white hover:bg-primary/90"
                    disabled={updateChapterMutation.isPending}
                  >
                    {updateChapterMutation.isPending ? "Updating..." : "Update Chapter"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Card>
            <CardHeader>
              <CardTitle>Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : chapters && chapters.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Order</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Name</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Description</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chapters
                        .sort((a, b) => (a.order || 1) - (b.order || 1))
                        .map((chapter) => (
                        <tr key={chapter.id} className="border-b border-border">
                          <td className="px-3 py-3">{chapter.order || 1}</td>
                          <td className="px-3 py-3">{chapter.name}</td>
                          <td className="px-3 py-3">{chapter.description || "-"}</td>
                          <td className="px-3 py-3">
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-primary hover:bg-primary/10 rounded"
                                onClick={() => handleEditClick(chapter)}
                              >
                                <span className="material-icons">edit</span>
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-primary hover:bg-primary/10 rounded"
                                onClick={() => handleManageSubchapters(chapter.id)}
                                title="Manage Subchapters"
                              >
                                <span className="material-icons">list</span>
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-destructive hover:bg-destructive/10 rounded"
                                    onClick={() => setChapterToDelete(chapter)}
                                  >
                                    <span className="material-icons">delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the chapter "{chapterToDelete?.name}"? 
                                      This will also delete all subchapters and study materials associated with this chapter.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                      onClick={() => chapterToDelete && deleteChapterMutation.mutate(chapterToDelete.id)}
                                    >
                                      {deleteChapterMutation.isPending ? "Deleting..." : "Delete"}
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
                  <span className="material-icons text-4xl text-gray-400">menu_book</span>
                  <p className="mt-4 text-lg text-gray-600">No chapters found for this subject.</p>
                  <p className="text-gray-600">Click the "Add Chapter" button to create your first chapter.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}