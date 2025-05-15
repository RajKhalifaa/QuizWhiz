import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCompletionTime } from "@/lib/timeUtils";
import { isLevelPassed } from "@/lib/quizHelpers";

interface QuizResultsParams {
  quizId: string;
  score?: string;
  time?: string;
}

// Define the Quiz type for proper type checking
interface Quiz {
  id: number;
  materialId: number;
  level: string;
  questions: any[];
  createdAt?: string;
}

export default function QuizResults() {
  const [, params] = useRoute("/results/:quizId");
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Parse URL parameters
  const quizId = Number(params?.quizId);
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const score = Number(searchParams.get('score') || 0);
  const timeTaken = searchParams.get('time') || "00:00";
  
  const { data: quiz, isLoading, error } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !isNaN(quizId)
  });
  
  const { data: recommendation, isLoading: isLoadingRecommendation } = useQuery({
    queryKey: [`/api/student-report`],
    enabled: !isNaN(quizId) && score > 0
  });
  
  const levelPassed = isLevelPassed(quiz && quiz.level ? quiz.level : "Beginner", score);
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load quiz results. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Mock question data based on the quiz results
  // In a real app, you would get this from the API
  const questions = [
    {
      question: "Which of these is a flowering plant?",
      userAnswer: "Rose",
      correct: true,
      explanation: "Roses produce colorful flowers that later turn into rose hips (fruits)."
    },
    {
      question: "Which part of the plant absorbs water from the soil?",
      userAnswer: "Leaves",
      correctAnswer: "Roots",
      correct: false,
      explanation: "Roots absorb water and nutrients from the soil and anchor the plant."
    }
  ];
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }
  
  if (!quiz && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-icons text-6xl text-gray-400">error_outline</span>
          <p className="mt-4 text-lg text-gray-600">Quiz results not found.</p>
          <Link href="/subjects">
            <Button className="mt-6">
              Return to Subjects
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          className="mr-4 rounded-full" 
          asChild
        >
          <Link href="/subjects">
            <span className="material-icons text-primary">arrow_back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quiz Results</h1>
          <p className="text-gray-600 mt-1">Great job completing the quiz!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main results area */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center mb-8">
                <div className="w-32 h-32 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-primary">{score >= 0 && score <= 100 ? `${score}%` : `${Math.min(100, Math.max(0, Math.round(score * 20)))}%`}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  <span>{quiz?.level || "Beginner"}</span> Level: {" "}
                  <span className={levelPassed ? "text-success" : "text-danger"}>
                    {levelPassed ? "Passed!" : "Not passed"}
                  </span>
                </h2>
                <p className="text-gray-600 mt-1">
                  {score >= 0 && score <= 100 
                    ? `You answered ${Math.round((score / 100) * 5)} out of 5 questions correctly`
                    : `You answered ${Math.round(score)} out of 5 questions correctly (${Math.min(100, Math.max(0, Math.round(score * 20)))}%)`
                  }
                </p>
                <p className="text-gray-600">
                  Completed in <span>{formatCompletionTime(timeTaken)}</span>
                </p>
              </div>

              <h3 className="font-bold text-gray-800 mb-4">Question Summary:</h3>
              <div className="space-y-4 mb-6">
                {questions.map((question, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-2">
                      <span className={`inline-block w-6 h-6 rounded-full ${question.correct ? 'bg-success' : 'bg-danger'} text-white text-center mr-2`}>
                        {question.correct ? '✓' : '✗'}
                      </span>
                      {question.question}
                    </h4>
                    <div className="ml-8">
                      <p className={`font-bold ${question.correct ? 'text-success' : 'text-danger'}`}>
                        Your answer: {question.userAnswer} {question.correct ? '(Correct)' : '(Incorrect)'}
                      </p>
                      {!question.correct && (
                        <p className="text-success font-bold">Correct answer: {question.correctAnswer}</p>
                      )}
                      <p className="text-gray-600 text-sm mt-1">{question.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Link href={quiz && quiz.materialId && quiz.level ? `/quiz/${quiz.materialId}/${quiz.level}` : "/subjects"}>
                  <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
                    {quiz && quiz.materialId && quiz.level ? "Retake Quiz" : "Back to Subjects"}
                  </Button>
                </Link>
                <Link href={quiz && quiz.materialId ? `/leaderboard/material/${quiz.materialId}` : "/subjects"}>
                  <Button className="bg-secondary text-white hover:bg-secondary/90">
                    {quiz && quiz.materialId ? "View Leaderboard" : "Back to Subjects"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar area */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Achievement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1559223607-a43c990c692c?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&h=200&q=80" 
                    alt="Achievement badge" 
                    className="w-full h-auto animate-bounce-slow"
                  />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {score >= 80 ? "Quiz Master" : score >= 60 ? "Knowledge Explorer" : "Learning Starter"}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {score >= 80 
                    ? "You're excellent at this subject!" 
                    : score >= 60 
                    ? "You're making great progress!" 
                    : "Keep learning and you'll improve!"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Study Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-l-4 border-primary pl-4 py-1 mb-4">
                <p className="text-gray-600">Based on your quiz performance, here's what you should focus on:</p>
              </div>
              
              {isLoadingRecommendation ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ) : recommendation ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Review Plant Parts</h3>
                    <p className="text-gray-600 text-sm">Focus on understanding the functions of different plant parts, especially roots.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Try {score >= 80 ? "Advanced" : score >= 60 ? "Intermediate" : "Beginner"} Level</h3>
                    <p className="text-gray-600 text-sm">
                      {score >= 80 
                        ? "You're ready for the advanced level challenges!" 
                        : score >= 60 
                        ? "You're ready to move up to intermediate difficulty on this topic!"
                        : "Continue practicing at the beginner level to build your knowledge."}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No recommendations available at this time.</p>
              )}
              
              <Link href="/student-report">
                <Button 
                  className="w-full bg-primary/20 text-primary hover:bg-primary hover:text-white mt-6"
                >
                  View Full Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
