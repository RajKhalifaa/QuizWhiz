import { useState, useEffect, createContext, useContext } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';

type User = {
  id: number;
  username: string;
  email: string;
  is_teacher: boolean;
  isTeacher?: boolean; // Added for compatibility with backend JSON responses
  first_name?: string;
  last_name?: string;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type RegistrationData = {
  username: string;
  password: string;
  confirm_password: string;
  email: string;
  isTeacher?: boolean;
  first_name?: string;
  last_name?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegistrationData) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function DjangoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved token and user info in localStorage
    const savedToken = localStorage.getItem('djangoAuthToken');
    const savedUser = localStorage.getItem('djangoUser');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    setIsLoading(false);
  }, []);
  
  // Fetch user details if token exists but user doesn't
  useEffect(() => {
    if (token && !user) {
      fetchUserDetails();
    }
  }, [token, user]);
  
  const fetchUserDetails = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await apiRequest('GET', '/api/user', undefined, headers);
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('djangoUser', JSON.stringify(userData));
      } else {
        // If we couldn't get user details, the token might be invalid
        logout();
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/login', credentials);
      
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        
        // Save to localStorage
        localStorage.setItem('djangoAuthToken', data.token);
        localStorage.setItem('djangoUser', JSON.stringify(data.user));
        
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed');
        return false;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Network error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (data: RegistrationData): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Convert Django-style registration data to the expected format
      const registrationData = {
        username: data.username,
        password: data.password,
        email: data.email,
        isTeacher: data.isTeacher || false // Use provided value or default to student
      };
      
      const response = await apiRequest('POST', '/api/register', registrationData);
      
      if (response.ok) {
        // After registration, log the user in
        return await login({
          username: data.username,
          password: data.password
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Registration failed');
        return false;
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || 'Network error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      // Call the logout endpoint if available
      if (token) {
        const headers = { Authorization: `Bearer ${token}` };
        await apiRequest('POST', '/api/logout', undefined, headers);
      }
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      // Clear state and localStorage regardless of API response
      setToken(null);
      setUser(null);
      
      // Clear localStorage
      localStorage.removeItem('djangoAuthToken');
      localStorage.removeItem('djangoUser');
    }
  };
  
  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useDjangoAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useDjangoAuth must be used within a DjangoAuthProvider');
  }
  return context;
}

export default useDjangoAuth;