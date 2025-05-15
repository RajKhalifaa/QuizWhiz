import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, UseQueryOptions } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { QuizQuestion, QuizState, createQuizState, selectAnswer, goToNextQuestion, goToPreviousQuestion, completeQuiz } from "@/lib/quizHelpers";
import { formatTime, getElapsedTime } from "@/lib/timeUtils";
import useDjangoAuth from "@/hooks/use-django-auth";

// Define the expected quiz data structure
interface QuizData {
  id: number;
  materialId: number;
  level: string;
  questions: QuizQuestion[];
  createdAt: string;
};

export default function Quiz() {
  const [, params] = useRoute("/quiz/:materialId/:level");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const materialId = Number(params?.materialId);
  const level = params?.level || "Beginner";
  
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const timerRef = useRef<number | null>(null);
  
  // Get authentication state
  const { token, isAuthenticated, isLoading } = useDjangoAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access quizzes",
        variant: "destructive"
      });
      navigate("/auth");
    }
  }, [isAuthenticated, token, isLoading, navigate, toast]);
  
  // Try to fetch an existing quiz first
  const { 
    data: quiz, 
    isLoading: isLoadingQuiz, 
    error: quizError,
    isError: isQuizError
  } = useQuery<QuizData>({
    queryKey: [`/api/generate-quiz/${materialId}?level=${level}`],
    enabled: !isNaN(materialId) && !!level && !!token,
    queryFn: async ({ queryKey }) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await fetch(queryKey[0] as string, {
        headers,
        credentials: "include",
      });
      
      if (response.status === 404) {
        throw new Error("404: Quiz not found");
      }
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text || response.statusText}`);
      }
      
      return await response.json();
    },
    retry: (failureCount, error: any) => {
      // Don't retry if we got a 404 (no quiz found)
      return !(error?.message?.includes('404')) && failureCount < 3;
    }
  });
  
  // If we couldn't find an existing quiz, we'll need to generate one
  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      // Add authentication header if token is available
      console.log('Generating quiz with token:', token ? 'Present' : 'Not found');
      console.log('Authentication state:', isAuthenticated);
      
      // Retrieve token from localStorage directly to avoid any state issues
      const localStorageToken = localStorage.getItem('djangoAuthToken');
      console.log('Token from localStorage:', localStorageToken ? 'Present' : 'Not found');
      
      // Use token from state or localStorage
      const effectiveToken = token || localStorageToken;
      
      // Always ensure headers are properly set
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token exists
      if (effectiveToken) {
        headers['Authorization'] = `Bearer ${effectiveToken}`;
      }
      
      // Detailed logging for debugging
      console.log('Headers being sent:', Object.keys(headers).join(', '));
      
      const response = await apiRequest("POST", `/api/generate-quiz/${materialId}`, { level }, headers);
      
      console.log('Quiz generation response status:', response.status);
      if (!response.ok) {
        console.error('Quiz generation failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`Failed to generate quiz: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data?.questions && data.questions.length > 0) {
        setQuizState(createQuizState(data.questions));
        queryClient.invalidateQueries({ queryKey: [`/api/generate-quiz/${materialId}?level=${level}`] });
        toast({
          title: "Success",
          description: "Quiz generated successfully!"
        });
      }
    },
    onError: (error: Error) => {
      console.error('Quiz generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate quiz. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // If there's no existing quiz and we're not currently generating one,
  // trigger the generation
  useEffect(() => {
    if (isAuthenticated && token && !isLoading) {
      if (isQuizError && !generateQuizMutation.isPending && !generateQuizMutation.isSuccess) {
        console.log("Generating quiz with token:", token ? "Token present" : "No token");
        generateQuizMutation.mutate();
      }
    }
  }, [isQuizError, generateQuizMutation.isPending, generateQuizMutation.isSuccess, isAuthenticated, token, isLoading, materialId, level]);
  
  const submitQuizMutation = useMutation({
    mutationFn: async (quizData: { 
      quizId: number, 
      score: number, 
      timeTaken: string,
      incorrectQuestions: QuizQuestion[]
    }) => {
      // Add authentication header if token is available
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await apiRequest("POST", "/api/quiz-scores", {
        quizId: quizData.quizId,
        score: quizData.score,
        timeTaken: quizData.timeTaken
      }, headers);
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (quiz) {
        navigate(`/results/${quiz.id}?score=${variables.score}&time=${variables.timeTaken}`);
      } else {
        navigate(`/subjects`); // Fallback in case quiz is not defined
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Set up timer effect
  // Set up effect to process quiz data when it's available
  useEffect(() => {
    if (quiz?.questions && quiz.questions.length > 0 && !quizState) {
      setQuizState(createQuizState(quiz.questions));
    }
  }, [quiz, quizState]);

  // Set up timer effect
  useEffect(() => {
    if (quizState && !quizState.endTime) {
      // Update timer every second
      timerRef.current = window.setInterval(() => {
        const elapsed = getElapsedTime(quizState.startTime);
        setElapsedTime(formatTime(elapsed));
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizState]);
  
  useEffect(() => {
    if (quizError) {
      toast({
        title: "Error",
        description: "Failed to load quiz. Please try again.",
        variant: "destructive"
      });
    }
  }, [quizError, toast]);
  
  const handleOptionSelect = (optionIndex: number) => {
    if (!quizState || quizState.endTime) return;
    
    setQuizState(selectAnswer(quizState, optionIndex));
  };
  
  const handlePreviousQuestion = () => {
    if (!quizState || quizState.endTime) return;
    
    setQuizState(goToPreviousQuestion(quizState));
  };
  
  const handleNextQuestion = () => {
    if (!quizState || quizState.endTime || !quiz) return;
    
    // If at the last question, submit the quiz
    if (quizState.currentQuestionIndex === quizState.questions.length - 1) {
      const { score, timeTaken, incorrectQuestions } = completeQuiz(quizState);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // We've already checked that quiz is not null above
      submitQuizMutation.mutate({
        quizId: quiz!.id,
        score,
        timeTaken,
        incorrectQuestions
      });
    } else {
      setQuizState(goToNextQuestion(quizState));
    }
  };
  
  const currentQuestion = quizState?.questions[quizState.currentQuestionIndex];
  const currentAnswer = quizState?.answers[quizState.currentQuestionIndex];
  const progress = quizState ? Math.round(((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100) : 0;
  
  // Calculate current score
  const answeredCount = quizState?.answers.filter(a => a !== null).length || 0;
  const correctCount = quizState?.questions.reduce((count, q, index) => {
    return count + (quizState.answers[index] === q.correctAnswerIndex ? 1 : 0);
  }, 0) || 0;
  
  // Show loading states
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (isLoadingQuiz || generateQuizMutation.isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Generating your quiz...</p>
        </div>
      </div>
    );
  }
  
  if (!quizState || !currentQuestion) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-icons text-6xl text-gray-400">quiz</span>
          <p className="mt-4 text-lg text-gray-600">No quiz questions available. Please try again later.</p>
          <Link href={`/subjects/${materialId}/chapters`}>
            <Button className="mt-6">
              Return to chapters
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" className="mr-4 rounded-full" asChild>
          <Link href={`/subjects`}>
            <span className="material-icons text-primary">arrow_back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            <span>{level}</span> Quiz
          </h1>
          <div className="flex items-center mt-1">
            <span className="material-icons text-warning mr-1">timer</span>
            <span className="text-gray-600">{elapsedTime}</span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <span className="font-bold text-gray-800 mr-2">Progress:</span>
              <div className="flex items-center">
                <span className="text-primary font-bold">{quizState.currentQuestionIndex + 1}</span>
                <span className="text-gray-600">/</span>
                <span className="text-gray-600">{quizState.questions.length}</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-gray-800 mr-2">Score:</span>
              <span className="text-success font-bold">{correctCount}</span>
              <span className="text-gray-600">/</span>
              <span className="text-gray-600">{answeredCount}</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {quizState.currentQuestionIndex + 1}. {currentQuestion.question}
            </h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index}
                  className={`quiz-option ${currentAnswer === index ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(index)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <span className="font-bold text-primary">{String.fromCharCode(65 + index)}</span>
                    </div>
                    <span className="text-gray-800">{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={quizState.currentQuestionIndex === 0 || submitQuizMutation.isPending}
            >
              Previous
            </Button>
            <Button 
              className="bg-primary text-white hover:bg-primary/90"
              onClick={handleNextQuestion}
              disabled={currentAnswer === null || submitQuizMutation.isPending}
            >
              {quizState.currentQuestionIndex === quizState.questions.length - 1 ? (
                submitQuizMutation.isPending ? "Submitting..." : "Finish Quiz"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
