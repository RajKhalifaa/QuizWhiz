import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  headers?: Record<string, string>
): Promise<Response> {
  // Get token from localStorage
  const token = localStorage.getItem('djangoAuthToken');
    
  const requestHeaders: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    // Add token to headers if available
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(headers || {})
  };
  
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Don't throw error here so we can handle non-200 responses in the calling function
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get token from localStorage
    const token = localStorage.getItem('djangoAuthToken');
    
    // Set up headers with auth token if available
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
