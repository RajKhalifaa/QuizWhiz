import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { Sidebar } from "@/components/ui/sidebar";
import { apiRequest } from "@/lib/queryClient";
import { User, Subject, Chapter, Subchapter, StudyMaterial, Quiz, QuizScore } from "@shared/schema";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
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
  
  // Redirect to view subjects when clicking View Subjects in the dashboard
  const handleViewSubjects = () => {
    navigate("/admin/view-subjects");
  };
  
  // Fetch counts for dashboard statistics
  const { data: counts, isLoading } = useQuery<{
    subjects: number;
    chapters: number;
    subchapters: number;
    materials: number;
    quizzes: number;
    students: number;
    quizAttempts: number;
  }>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      try {
        // Fallback implementation when backend endpoint doesn't exist yet
        const [subjects, chapters, subchapters, materials, quizzes, users, scores] = await Promise.all([
          apiRequest("GET", "/api/subjects").then(res => res.json()),
          apiRequest("GET", "/api/chapters").then(res => res.json()),
          apiRequest("GET", "/api/subchapters").then(res => res.json()),
          apiRequest("GET", "/api/materials").then(res => res.json()),
          apiRequest("GET", "/api/quizzes").then(res => res.json()).catch(() => []),
          apiRequest("GET", "/api/users").then(res => res.json()).catch(() => []),
          apiRequest("GET", "/api/quiz-scores").then(res => res.json()).catch(() => [])
        ]);
        
        const studentCount = users.filter((u: User) => !u.isTeacher).length;
        
        return {
          subjects: subjects.length,
          chapters: chapters.length,
          subchapters: subchapters.length,
          materials: materials.length,
          quizzes: quizzes.length,
          students: studentCount,
          quizAttempts: scores.length
        };
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Return fallback data when the endpoints are not available
        return {
          subjects: 0,
          chapters: 0,
          subchapters: 0,
          materials: 0,
          quizzes: 0,
          students: 0,
          quizAttempts: 0
        };
      }
    },
    retry: 1,
  });
  
  // Fetch recent activity
  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery<any[]>({
    queryKey: ["/api/admin/recent-activity"],
    queryFn: async () => {
      try {
        // Fallback implementation for recent activity
        const [materials, quizzes, scores] = await Promise.all([
          apiRequest("GET", "/api/materials").then(res => res.json()),
          apiRequest("GET", "/api/quizzes").then(res => res.json()).catch(() => []),
          apiRequest("GET", "/api/quiz-scores").then(res => res.json()).catch(() => [])
        ]);
        
        // Convert materials to activity items
        const materialActivity = materials.map((material: StudyMaterial) => ({
          type: "material",
          title: `New study material: ${material.title}`,
          timestamp: new Date(material.createdAt),
          data: material
        }));
        
        // Convert quizzes to activity items
        const quizActivity = quizzes.map((quiz: Quiz) => ({
          type: "quiz",
          title: `New quiz generated for material #${quiz.materialId}`,
          timestamp: new Date(quiz.createdAt),
          data: quiz
        }));
        
        // Convert scores to activity items
        const scoreActivity = scores.map((score: QuizScore) => ({
          type: "score",
          title: `Quiz #${score.quizId} completed by user #${score.userId}`,
          timestamp: new Date(score.completedAt),
          data: score
        }));
        
        // Combine and sort by timestamp (newest first)
        return [...materialActivity, ...quizActivity, ...scoreActivity]
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        return [];
      }
    },
    retry: 1,
  });
  
  interface StudentScore {
    id: number;
    username: string;
    averageScore: number;
    quizzesTaken: number;
  }
  
  // Get top performing students (those with highest average scores)
  const { data: topStudents, isLoading: isLoadingTopStudents } = useQuery<StudentScore[]>({
    queryKey: ["/api/admin/top-students"],
    queryFn: async () => {
      try {
        // Fallback implementation for top students
        const [users, scores] = await Promise.all([
          apiRequest("GET", "/api/users").then(res => res.json()).catch(() => []),
          apiRequest("GET", "/api/quiz-scores").then(res => res.json()).catch(() => [])
        ]);
        
        // Filter only students
        const students = users.filter((user: User) => !user.isTeacher);
        
        // Calculate average score for each student
        const studentScores: StudentScore[] = students.map((student: User) => {
          const studentScores = scores.filter((score: QuizScore) => score.userId === student.id);
          const totalScore = studentScores.reduce((sum: number, score: QuizScore) => sum + score.score, 0);
          const averageScore = studentScores.length > 0 ? totalScore / studentScores.length : 0;
          
          return {
            id: student.id,
            username: student.username,
            averageScore: averageScore,
            quizzesTaken: studentScores.length
          };
        });
        
        // Sort by average score and return top 5
        return studentScores
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 5);
      } catch (error) {
        console.error("Error fetching top students:", error);
        return [];
      }
    },
    retry: 1,
  });
  
  const activityIcons: Record<string, string> = {
    material: "description",
    quiz: "quiz",
    score: "grade"
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block w-64 min-h-screen" />
      
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={handleViewSubjects}
              >
                <span className="material-icons mr-2">visibility</span>
                View Subjects
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/admin/manage-subjects")}
              >
                <span className="material-icons mr-2">category</span>
                Manage Subjects
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/admin/materials")}
              >
                <span className="material-icons mr-2">description</span>
                Manage Materials
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Study Materials"
              value={counts?.materials ?? 0}
              icon="description"
              color="bg-blue-500"
              isLoading={isLoading}
            />
            <StatCard
              title="Quizzes Generated"
              value={counts?.quizzes ?? 0}
              icon="quiz"
              color="bg-green-500"
              isLoading={isLoading}
            />
            <StatCard
              title="Active Students"
              value={counts?.students ?? 0}
              icon="people"
              color="bg-amber-500"
              isLoading={isLoading}
            />
            <StatCard
              title="Quiz Attempts"
              value={counts?.quizAttempts ?? 0}
              icon="assignment_turned_in"
              color="bg-purple-500"
              isLoading={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingActivity ? (
                  <div className="flex justify-center py-8">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                          activity.type === 'material' ? 'bg-blue-500' : 
                          activity.type === 'quiz' ? 'bg-green-500' : 'bg-purple-500'
                        }`}>
                          <span className="material-icons">{activityIcons[activity.type]}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <span className="material-icons text-4xl text-gray-400">history</span>
                    <p className="mt-4 text-gray-600">No recent activity found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Students</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTopStudents ? (
                  <div className="flex justify-center py-8">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : topStudents && topStudents.length > 0 ? (
                  <div className="space-y-4">
                    {topStudents.map((student, index) => (
                      <div key={student.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium text-gray-900">{student.username}</p>
                            <p className="font-semibold text-primary">{student.averageScore.toFixed(1)}%</p>
                          </div>
                          <p className="text-sm text-gray-500">
                            {student.quizzesTaken} quiz{student.quizzesTaken !== 1 ? 'zes' : ''} completed
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <span className="material-icons text-4xl text-gray-400">emoji_events</span>
                    <p className="mt-4 text-gray-600">No student data available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, color, isLoading = false }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white mr-4`}>
            <span className="material-icons">{icon}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {isLoading ? (
              <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}