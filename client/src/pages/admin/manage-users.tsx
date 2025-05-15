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
import { Switch } from "@/components/ui/switch";
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
import { User } from "@shared/schema";

export default function ManageUsers() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showTeachers, setShowTeachers] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
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
  
  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/users");
        return await response.json();
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },
  });
  
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const filteredUsers = users?.filter(user => {
    // Filter by search term
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by role
    const matchesRole = showTeachers ? true : !user.isTeacher;
    
    return matchesSearch && matchesRole;
  });
  
  // Get quiz stats for users
  const { data: quizStats } = useQuery<Record<number, { count: number, avgScore: number }>>({
    queryKey: ["/api/quiz-stats-by-user"],
    queryFn: async () => {
      try {
        const scores = await apiRequest("GET", "/api/quiz-scores").then(res => res.json()).catch(() => []);
        
        // Group by userId
        const statsByUser: Record<number, { count: number, avgScore: number }> = {};
        
        scores.forEach((score: any) => {
          if (!statsByUser[score.userId]) {
            statsByUser[score.userId] = { count: 0, avgScore: 0 };
          }
          
          statsByUser[score.userId].count += 1;
          statsByUser[score.userId].avgScore += score.score;
        });
        
        // Calculate averages
        Object.keys(statsByUser).forEach(userId => {
          const stats = statsByUser[Number(userId)];
          if (stats.count > 0) {
            stats.avgScore = stats.avgScore / stats.count;
          }
        });
        
        return statsByUser;
      } catch (error) {
        console.error("Error fetching quiz stats:", error);
        return {};
      }
    },
    retry: 1,
  });
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block w-64 min-h-screen" />
      
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="material-icons text-gray-400">search</span>
                </span>
                <Input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="show-teachers"
                  checked={showTeachers} 
                  onCheckedChange={setShowTeachers} 
                />
                <Label htmlFor="show-teachers">Show Teachers</Label>
              </div>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="px-3 py-3 text-left font-bold text-gray-800">User</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Role</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Joined</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Quizzes</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Avg. Score</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const userStats = quizStats?.[user.id] || { count: 0, avgScore: 0 };
                        
                        return (
                          <tr key={user.id} className="border-b border-border">
                            <td className="px-3 py-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                                  <span className="material-icons text-primary text-sm">
                                    {user.isTeacher ? "school" : "person"}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{user.username}</p>
                                  <p className="text-sm text-gray-500">{user.email || "No email"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                user.isTeacher 
                                  ? "bg-purple-100 text-purple-800" 
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {user.isTeacher ? "Teacher" : "Student"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-3">
                              {userStats.count}
                            </td>
                            <td className="px-3 py-3">
                              {userStats.count > 0 ? `${userStats.avgScore.toFixed(1)}%` : "-"}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-primary hover:bg-primary/10 rounded"
                                  onClick={() => navigate(`/student-report?userId=${user.id}`)}
                                  title="View Reports"
                                >
                                  <span className="material-icons">assessment</span>
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="text-destructive hover:bg-destructive/10 rounded"
                                      onClick={() => setUserToDelete(user)}
                                      disabled={user.id === user?.id} // Prevent deleting yourself
                                    >
                                      <span className="material-icons">delete</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the user "{userToDelete?.username}"? 
                                        This will also delete all quiz scores and data associated with this user.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                        onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
                                      >
                                        {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="material-icons text-4xl text-gray-400">people</span>
                  <p className="mt-4 text-lg text-gray-600">No users found.</p>
                  {searchTerm && (
                    <p className="text-gray-600">Try different search terms.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}