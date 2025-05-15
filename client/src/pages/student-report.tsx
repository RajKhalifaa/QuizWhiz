import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCompletionTime } from "@/lib/timeUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ScoreData {
  id: number;
  score: number;
  timeTaken: string;
  completedAt: string;
  materialTitle: string;
  subchapterName: string;
  chapterName: string;
  subjectName: string;
  level: string;
}

interface SubjectPerformance {
  [subject: string]: {
    totalQuizzes: number;
    totalScore: number;
    averageScore: number;
    quizzes: ScoreData[];
  };
}

interface StudentReportData {
  totalQuizzes: number;
  averageScore: number;
  quizScores: ScoreData[];
  recommendations: any[];
  subjectPerformance: SubjectPerformance;
}

export default function StudentReport() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery<StudentReportData>({
    queryKey: ["/api/student-report"],
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load your report. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Prepare chart data
  const getChartData = () => {
    if (!data?.subjectPerformance) return [];
    
    return Object.entries(data.subjectPerformance).map(([subject, performance]) => ({
      name: subject,
      average: Math.round(performance.averageScore),
    }));
  };
  
  // Prepare recent quizzes data (limit to 5)
  const getRecentQuizzes = () => {
    if (!data?.quizScores) return [];
    
    return [...data.quizScores]
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 5);
  };
  
  const chartData = getChartData();
  const recentQuizzes = getRecentQuizzes();
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your progress report...</p>
        </div>
      </div>
    );
  }
  
  if (!data && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-icons text-6xl text-gray-400">assignment</span>
          <p className="mt-4 text-lg text-gray-600">No progress data available yet.</p>
          <p className="text-gray-600">Take some quizzes to see your progress!</p>
          <Link href="/subjects">
            <Button className="mt-6">
              Browse Subjects
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Progress Report</h1>
          <p className="text-gray-600 mt-1">Track your learning journey</p>
        </div>
        <Link href="/subjects">
          <Button className="bg-primary text-white hover:bg-primary/90">
            Take More Quizzes
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start">
              <div className="bg-primary/20 p-3 rounded-lg">
                <span className="material-icons text-primary">quiz</span>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800">{data?.totalQuizzes || 0}</h3>
                <p className="text-gray-600">Quizzes Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start">
              <div className="bg-secondary/20 p-3 rounded-lg">
                <span className="material-icons text-secondary">stacked_bar_chart</span>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800">{Math.round(data?.averageScore || 0)}%</h3>
                <p className="text-gray-600">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start">
              <div className="bg-[#66BB6A]/20 p-3 rounded-lg">
                <span className="material-icons text-[#66BB6A]">emoji_events</span>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {Object.keys(data?.subjectPerformance || {}).length}
                </h3>
                <p className="text-gray-600">Subjects Studied</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Performance by Subject</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                    <Bar dataKey="average" name="Average Score (%)" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="material-icons text-4xl text-gray-400">bar_chart</span>
                  <p className="mt-2 text-gray-600">No performance data available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentQuizzes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Subject</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Material</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Level</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Score</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Date</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentQuizzes.map((quiz) => (
                        <tr key={quiz.id} className="border-b border-border">
                          <td className="px-3 py-3">{quiz.subjectName}</td>
                          <td className="px-3 py-3">{quiz.materialTitle}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              quiz.level === 'Beginner' ? 'bg-primary/20 text-primary' :
                              quiz.level === 'Intermediate' ? 'bg-secondary/20 text-secondary' :
                              'bg-[#66BB6A]/20 text-[#66BB6A]'
                            }`}>
                              {quiz.level}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-bold">
                            <span className={
                              quiz.score >= 80 ? 'text-[#66BB6A]' :
                              quiz.score >= 60 ? 'text-[#FFCA28]' :
                              'text-danger'
                            }>
                              {quiz.score}%
                            </span>
                          </td>
                          <td className="px-3 py-3">{formatDate(quiz.completedAt)}</td>
                          <td className="px-3 py-3">
                            <Link href={`/leaderboard/material/${quiz.id}`}>
                              <Button variant="ghost" size="sm" className="text-primary">
                                <span className="material-icons text-sm mr-1">leaderboard</span>
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <span className="material-icons text-4xl text-gray-400">history</span>
                  <p className="mt-2 text-gray-600">No quiz history available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AI Study Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.recommendations && data.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {data.recommendations.map((recommendation, index) => (
                    <Card key={index} className="bg-primary/5 border-none">
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <span className="material-icons text-primary mr-2">psychology</span>
                          <div>
                            <p className="text-gray-600">{recommendation.recommendation}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(recommendation.generatedAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <span className="material-icons text-4xl text-gray-400">tips_and_updates</span>
                  <p className="mt-2 text-gray-600">No recommendations available yet.</p>
                  <p className="text-gray-600">Complete more quizzes to get personalized tips!</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    data?.totalQuizzes && data.totalQuizzes >= 5 
                      ? 'bg-primary/20' 
                      : 'bg-gray-200'
                  }`}>
                    <span className={`material-icons text-2xl ${
                      data?.totalQuizzes && data.totalQuizzes >= 5 
                        ? 'text-primary' 
                        : 'text-gray-400'
                    }`}>
                      quiz
                    </span>
                  </div>
                  <p className="text-sm font-bold mt-2 text-center">Quiz Champion</p>
                  <p className="text-xs text-gray-500 text-center">
                    Complete 5 quizzes
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    data?.averageScore && data.averageScore >= 80 
                      ? 'bg-[#66BB6A]/20' 
                      : 'bg-gray-200'
                  }`}>
                    <span className={`material-icons text-2xl ${
                      data?.averageScore && data.averageScore >= 80 
                        ? 'text-[#66BB6A]' 
                        : 'text-gray-400'
                    }`}>
                      emoji_events
                    </span>
                  </div>
                  <p className="text-sm font-bold mt-2 text-center">High Achiever</p>
                  <p className="text-xs text-gray-500 text-center">
                    Get 80% average score
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    data?.subjectPerformance && Object.keys(data.subjectPerformance).length >= 3
                      ? 'bg-secondary/20' 
                      : 'bg-gray-200'
                  }`}>
                    <span className={`material-icons text-2xl ${
                      data?.subjectPerformance && Object.keys(data.subjectPerformance).length >= 3
                        ? 'text-secondary' 
                        : 'text-gray-400'
                    }`}>
                      school
                    </span>
                  </div>
                  <p className="text-sm font-bold mt-2 text-center">Explorer</p>
                  <p className="text-xs text-gray-500 text-center">
                    Study 3 subjects
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="material-icons text-2xl text-gray-400">
                      workspace_premium
                    </span>
                  </div>
                  <p className="text-sm font-bold mt-2 text-center">Master</p>
                  <p className="text-xs text-gray-500 text-center">
                    Complete all badges
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
