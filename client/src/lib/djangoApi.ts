import { apiRequest } from './queryClient';

// Base URL for Django API requests
const DJANGO_API_BASE = '/django-api';

export type DjangoAPIResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Make a GET request to the Django API
 */
export async function djangoApiGet<T>(endpoint: string, token?: string): Promise<DjangoAPIResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    
    const response = await fetch(`${DJANGO_API_BASE}${endpoint}`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: data as T
      };
    } else {
      return {
        success: false,
        error: data.detail || 'An error occurred'
      };
    }
  } catch (err: any) {
    console.error('Django API request failed:', err);
    return {
      success: false,
      error: err?.message || 'Network error'
    };
  }
}

/**
 * Make a POST request to the Django API
 */
export async function djangoApiPost<T>(endpoint: string, body: any, token?: string): Promise<DjangoAPIResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    
    const response = await fetch(`${DJANGO_API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: data as T
      };
    } else {
      return {
        success: false,
        error: data.detail || 'An error occurred'
      };
    }
  } catch (err: any) {
    console.error('Django API request failed:', err);
    return {
      success: false,
      error: err?.message || 'Network error'
    };
  }
}

/**
 * Upload a file to the Django API
 */
export async function djangoApiUpload<T>(endpoint: string, formData: FormData, token?: string): Promise<DjangoAPIResponse<T>> {
  try {
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    
    const response = await fetch(`${DJANGO_API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: data as T
      };
    } else {
      return {
        success: false,
        error: data.detail || 'An error occurred'
      };
    }
  } catch (err: any) {
    console.error('Django API file upload failed:', err);
    return {
      success: false,
      error: err?.message || 'Network error'
    };
  }
}

// Helper to download a file from the Django API
export function getDjangoFileUrl(filePath: string): string {
  return `${DJANGO_API_BASE}/media/${filePath}`;
}

// React Query helpers
export const getDjangoQueryFn = <T>(endpoint: string, token?: string) => 
  async (): Promise<T> => {
    const response = await djangoApiGet<T>(endpoint, token);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data!;
  };

export default {
  get: djangoApiGet,
  post: djangoApiPost,
  upload: djangoApiUpload,
  getFileUrl: getDjangoFileUrl,
  getQueryFn: getDjangoQueryFn
};