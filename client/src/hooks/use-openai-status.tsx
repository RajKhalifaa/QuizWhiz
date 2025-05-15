import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type OpenAIStatus = {
  isAvailable: boolean;
  isLoading: boolean;
  error: Error | null;
};

const OpenAIStatusContext = createContext<OpenAIStatus | null>(null);

export function OpenAIStatusProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [hasShownToast, setHasShownToast] = useState(false);
  
  const {
    data,
    isLoading,
    error,
  } = useQuery<{ status: string }>({
    queryKey: ["/api/check-openai"],
    retry: 2,
    retryDelay: 1000,
  });
  
  const isAvailable = data?.status === "available";
  
  // Show toast notification if OpenAI is not available
  useEffect(() => {
    if (!isLoading && !isAvailable && !hasShownToast) {
      toast({
        title: "AI Quiz Generation Limited",
        description: "The OpenAI service is currently unavailable. Some quiz generation features may be limited.",
        variant: "destructive",
        duration: 6000,
      });
      setHasShownToast(true);
    }
  }, [isLoading, isAvailable, toast, hasShownToast]);
  
  return (
    <OpenAIStatusContext.Provider
      value={{
        isAvailable: !!isAvailable,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </OpenAIStatusContext.Provider>
  );
}
export function useOpenAIStatus() {
  const context = useContext(OpenAIStatusContext);
  if (!context) {
    throw new Error("useOpenAIStatus must be used within an OpenAIStatusProvider");
  }
  return context;
}