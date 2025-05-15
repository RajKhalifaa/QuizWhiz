import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Subchapter, insertSubchapterSchema } from "@shared/schema";
import { ArrowLeft, Trash2, Pencil, Plus } from "lucide-react";

interface Chapter {
  id: number;
  name: string;
  subject?: {
    id: number;
    name: string;
  };
}

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  order: z.coerce.number().int().min(1, "Order must be at least 1"),
  chapterId: z.coerce.number().int().positive("Chapter ID is required")
});

export default function ManageSubchapters() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/admin/chapters/:chapterId/subchapters");
  const chapterId = match ? Number(params.chapterId) : undefined;
  
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubchapter, setSelectedSubchapter] = useState<Subchapter | null>(null);

  // Get chapter information
  const { data: chapter, isLoading: isLoadingChapter } = useQuery<Chapter>({
    queryKey: ["/api/chapters", chapterId],
    queryFn: async () => {
      if (!chapterId) return null;
      const res = await apiRequest("GET", `/api/chapters/${chapterId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch chapter");
      }
      return res.json();
    },
    enabled: !!chapterId
  });

  // Get subchapters for the chapter
  const { data: subchapters, isLoading } = useQuery<Subchapter[]>({
    queryKey: ["/api/subchapters", chapterId],
    queryFn: async () => {
      if (!chapterId) return [];
      const res = await apiRequest("GET", `/api/subchapters?chapterId=${chapterId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch subchapters");
      }
      return res.json();
    },
    enabled: !!chapterId
  });

  const createForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      order: 1,
      chapterId: chapterId || 0
    }
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      order: 1,
      chapterId: chapterId || 0
    }
  });

  // Set chapter ID in forms when it changes
  useEffect(() => {
    if (chapterId) {
      createForm.setValue("chapterId", chapterId);
      editForm.setValue("chapterId", chapterId);
    }
  }, [chapterId, createForm, editForm]);

  // Reset form when create dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      createForm.reset({
        name: "",
        description: "",
        order: subchapters?.length ? subchapters.length + 1 : 1,
        chapterId: chapterId || 0
      });
    }
  }, [isCreateDialogOpen, createForm, subchapters, chapterId]);

  // Set form values when edit dialog opens
  useEffect(() => {
    if (isEditDialogOpen && selectedSubchapter) {
      editForm.reset({
        name: selectedSubchapter.name,
        description: selectedSubchapter.description || "",
        order: selectedSubchapter.order || 1,
        chapterId: selectedSubchapter.chapterId
      });
    }
  }, [isEditDialogOpen, selectedSubchapter, editForm]);

  // Create subchapter mutation
  const createSubchapterMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/subchapters", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create subchapter");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subchapters", chapterId] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Subchapter created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create subchapter: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update subchapter mutation
  const updateSubchapterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof formSchema> }) => {
      const res = await apiRequest("PUT", `/api/subchapters/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update subchapter");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subchapters", chapterId] });
      setIsEditDialogOpen(false);
      setSelectedSubchapter(null);
      toast({
        title: "Success",
        description: "Subchapter updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update subchapter: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete subchapter mutation
  const deleteSubchapterMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/subchapters/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete subchapter");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subchapters", chapterId] });
      setIsDeleteDialogOpen(false);
      setSelectedSubchapter(null);
      toast({
        title: "Success",
        description: "Subchapter deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete subchapter: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const onCreateSubmit = (data: z.infer<typeof formSchema>) => {
    createSubchapterMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof formSchema>) => {
    if (selectedSubchapter) {
      updateSubchapterMutation.mutate({ 
        id: selectedSubchapter.id, 
        data: data 
      });
    }
  };

  const handleEdit = (subchapter: Subchapter) => {
    setSelectedSubchapter(subchapter);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (subchapter: Subchapter) => {
    setSelectedSubchapter(subchapter);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSubchapter) {
      deleteSubchapterMutation.mutate(selectedSubchapter.id);
    }
  };

  if (!match) {
    return <div>Invalid URL. No chapter ID provided.</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block w-64 min-h-screen" />
      
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/admin/manage-subjects")}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subjects
            </Button>
            <h1 className="text-2xl font-bold text-gray-800 flex-1">
              {isLoadingChapter ? "Loading..." : `Manage Subchapters: ${chapter?.name || ''}`}
            </h1>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subchapter
            </Button>
          </div>
          
          {isLoadingChapter ? (
            <div className="flex justify-center py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Subchapters</CardTitle>
                <CardDescription>
                  Manage subchapters for {chapter?.name} in {chapter?.subject?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : !subchapters || subchapters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No subchapters found for this chapter.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add your first subchapter
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subchapters.sort((a, b) => (a.order || 1) - (b.order || 1)).map((subchapter) => (
                        <TableRow key={subchapter.id}>
                          <TableCell>{subchapter.order || 1}</TableCell>
                          <TableCell className="font-medium">{subchapter.name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {subchapter.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(subchapter)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(subchapter)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Create Subchapter Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Subchapter</DialogTitle>
                <DialogDescription>
                  Create a new subchapter for {chapter?.name}.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter subchapter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter description (optional)" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Enter display order" 
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value === "" ? "1" : e.target.value;
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          The order in which this subchapter appears in the list
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createSubchapterMutation.isPending}
                    >
                      {createSubchapterMutation.isPending ? "Creating..." : "Create Subchapter"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Subchapter Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Subchapter</DialogTitle>
                <DialogDescription>
                  Update the details for this subchapter.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter subchapter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter description (optional)" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Enter display order" 
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value === "" ? "1" : e.target.value;
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          The order in which this subchapter appears in the list
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                      disabled={updateSubchapterMutation.isPending}
                    >
                      {updateSubchapterMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the subchapter "{selectedSubchapter?.name}"? 
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteSubchapterMutation.isPending}
                >
                  {deleteSubchapterMutation.isPending ? "Deleting..." : "Delete Subchapter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}