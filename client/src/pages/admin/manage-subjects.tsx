import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { Sidebar } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Subject } from "@shared/schema";

export default function ManageSubjects() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectIcon, setSubjectIcon] = useState("school");
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  
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
  
  // Fetch subjects
  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });
  
  const addSubjectMutation = useMutation({
    mutationFn: async (subjectData: { name: string; icon: string }) => {
      return await apiRequest("POST", "/api/subjects", subjectData);
    },
    onSuccess: () => {
      setIsAddDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: "Success",
        description: "Subject added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add subject. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; icon: string } }) => {
      return await apiRequest("PUT", `/api/subjects/${id}`, data);
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSubjectToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: "Success",
        description: "Subject updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subject. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: number) => {
      return await apiRequest("DELETE", `/api/subjects/${subjectId}`);
    },
    onSuccess: () => {
      setSubjectToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: "Success",
        description: "Subject deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subject. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setSubjectName("");
    setSubjectIcon("school");
  };
  
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subjectName) {
      toast({
        title: "Error",
        description: "Please enter a subject name.",
        variant: "destructive",
      });
      return;
    }
    
    addSubjectMutation.mutate({
      name: subjectName,
      icon: subjectIcon,
    });
  };
  
  const handleEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subjectName || !subjectToEdit) {
      toast({
        title: "Error",
        description: "Please enter a subject name.",
        variant: "destructive",
      });
      return;
    }
    
    updateSubjectMutation.mutate({
      id: subjectToEdit.id,
      data: {
        name: subjectName,
        icon: subjectIcon,
      },
    });
  };
  
  const handleEditClick = (subject: Subject) => {
    setSubjectToEdit(subject);
    setSubjectName(subject.name);
    setSubjectIcon(subject.icon || "school");
    setIsEditDialogOpen(true);
  };
  
  const handleManageChapters = (subjectId: number) => {
    navigate(`/admin/subjects/${subjectId}/chapters`);
  };
  
  const iconOptions = [
    { value: "school", label: "School" },
    { value: "calculate", label: "Mathematics" },
    { value: "science", label: "Science" },
    { value: "language", label: "Language" },
    { value: "psychology", label: "Psychology" },
    { value: "menu_book", label: "Book" },
    { value: "history_edu", label: "History" },
    { value: "palette", label: "Art" },
    { value: "fitness_center", label: "Physical Education" },
    { value: "music_note", label: "Music" },
  ];
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block w-64 min-h-screen" />
      
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Manage Subjects</h1>
            <Button 
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <span className="material-icons mr-2">add</span>
              Add Subject
            </Button>
            
            {/* Add Subject Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Create a new subject for students to explore.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddSubject}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="subject-name">Subject Name</Label>
                      <Input
                        id="subject-name"
                        placeholder="Enter subject name"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subject-icon">Subject Icon</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {iconOptions.map((icon) => (
                          <div
                            key={icon.value}
                            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer ${
                              subjectIcon === icon.value ? "bg-primary/20 border border-primary" : "hover:bg-gray-100"
                            }`}
                            onClick={() => setSubjectIcon(icon.value)}
                          >
                            <span className="material-icons text-2xl text-primary">{icon.value}</span>
                            <span className="text-xs mt-1 text-center">{icon.label}</span>
                          </div>
                        ))}
                      </div>
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
                      disabled={addSubjectMutation.isPending}
                    >
                      {addSubjectMutation.isPending ? "Adding..." : "Add Subject"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Edit Subject Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Subject</DialogTitle>
                  <DialogDescription>
                    Update the subject details.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditSubject}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-subject-name">Subject Name</Label>
                      <Input
                        id="edit-subject-name"
                        placeholder="Enter subject name"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-subject-icon">Subject Icon</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {iconOptions.map((icon) => (
                          <div
                            key={icon.value}
                            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer ${
                              subjectIcon === icon.value ? "bg-primary/20 border border-primary" : "hover:bg-gray-100"
                            }`}
                            onClick={() => setSubjectIcon(icon.value)}
                          >
                            <span className="material-icons text-2xl text-primary">{icon.value}</span>
                            <span className="text-xs mt-1 text-center">{icon.label}</span>
                          </div>
                        ))}
                      </div>
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
                      disabled={updateSubjectMutation.isPending}
                    >
                      {updateSubjectMutation.isPending ? "Updating..." : "Update Subject"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : subjects && subjects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Icon</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Name</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject) => (
                        <tr key={subject.id} className="border-b border-border">
                          <td className="px-3 py-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="material-icons text-primary">{subject.icon || "school"}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">{subject.name}</td>
                          <td className="px-3 py-3">
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-primary hover:bg-primary/10 rounded"
                                onClick={() => handleEditClick(subject)}
                              >
                                <span className="material-icons">edit</span>
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-primary hover:bg-primary/10 rounded"
                                onClick={() => handleManageChapters(subject.id)}
                                title="Manage Chapters"
                              >
                                <span className="material-icons">list</span>
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-destructive hover:bg-destructive/10 rounded"
                                    onClick={() => setSubjectToDelete(subject)}
                                  >
                                    <span className="material-icons">delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the subject "{subjectToDelete?.name}"? 
                                      This will also delete all chapters, subchapters, and study materials associated with this subject.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                      onClick={() => subjectToDelete && deleteSubjectMutation.mutate(subjectToDelete.id)}
                                    >
                                      {deleteSubjectMutation.isPending ? "Deleting..." : "Delete"}
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
                  <span className="material-icons text-4xl text-gray-400">school</span>
                  <p className="mt-4 text-lg text-gray-600">No subjects found.</p>
                  <p className="text-gray-600">Click the "Add Subject" button to create your first subject.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}