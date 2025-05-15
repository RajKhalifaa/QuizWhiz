import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import djangoApi from '@/lib/djangoApi';
import { useDjangoAuth } from './use-django-auth';

// Subject types
export type Subject = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

// Chapter types
export type Chapter = {
  id: number;
  subject: number;
  name: string;
  description: string | null;
  order: number;
  created_at: string;
};

export type ChapterDetail = Omit<Chapter, 'subject'> & {
  subject: Subject;
};

// Subchapter types
export type Subchapter = {
  id: number;
  chapter: number;
  name: string;
  description: string | null;
  order: number;
  created_at: string;
};

export type SubchapterDetail = Omit<Subchapter, 'chapter'> & {
  chapter: ChapterDetail;
};

// Study material types
export type StudyMaterial = {
  id: number;
  subchapter: number;
  title: string;
  description: string | null;
  document: string;
  file_type: string;
  file_size: string;
  uploaded_by: number;
  created_at: string;
};

export type StudyMaterialDetail = Omit<StudyMaterial, 'subchapter' | 'uploaded_by'> & {
  subchapter: SubchapterDetail;
  uploaded_by: {
    id: number;
    username: string;
  };
};

// Quiz types
export type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
};

export type Quiz = {
  id: number;
  material: number;
  level: string;
  questions: QuizQuestion[];
  created_at: string;
};

export type QuizDetail = Omit<Quiz, 'material'> & {
  material: StudyMaterial;
};

// Quiz score types
export type QuizScore = {
  id: number;
  user: {
    id: number;
    username: string;
  };
  quiz: number;
  score: number;
  time_taken: string;
  answers: any[];
  completed_at: string;
};

// Study recommendation types
export type StudyRecommendation = {
  id: number;
  user: {
    id: number;
    username: string;
  };
  subchapter: SubchapterDetail;
  recommendation: string;
  created_at: string;
};

// Hooks for subjects
export function useSubjects(): UseQueryResult<Subject[]> {
  const { token } = useDjangoAuth();
  
  return useQuery({
    queryKey: ['django-subjects'],
    queryFn: djangoApi.getQueryFn<Subject[]>('/subjects/', token || undefined)
  });
}

export function useCreateSubject() {
  const { token } = useDjangoAuth();
  
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await djangoApi.post<Subject>('/subjects/', data, token || undefined);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['django-subjects'] });
    }
  });
}

// Hooks for chapters
export function useChaptersBySubject(subjectId: number): UseQueryResult<Chapter[]> {
  const { token } = useDjangoAuth();
  
  return useQuery({
    queryKey: ['django-chapters', subjectId],
    queryFn: djangoApi.getQueryFn<Chapter[]>(`/chapters/?subject_id=${subjectId}`, token || undefined),
    enabled: !!subjectId
  });
}

export function useCreateChapter() {
  const { token } = useDjangoAuth();
  
  return useMutation({
    mutationFn: async (data: { subject: number; name: string; description?: string; order?: number }) => {
      const response = await djangoApi.post<Chapter>('/chapters/', data, token || undefined);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['django-chapters', data.subject] });
    }
  });
}

// Hooks for subchapters
export function useSubchaptersByChapter(chapterId: number): UseQueryResult<Subchapter[]> {
  const { token } = useDjangoAuth();
  
  return useQuery({
    queryKey: ['django-subchapters', chapterId],
    queryFn: djangoApi.getQueryFn<Subchapter[]>(`/subchapters/?chapter_id=${chapterId}`, token || undefined),
    enabled: !!chapterId
  });
}

export function useCreateSubchapter() {
  const { token } = useDjangoAuth();
  
  return useMutation({
    mutationFn: async (data: { chapter: number; name: string; description?: string; order?: number }) => {
      const response = await djangoApi.post<Subchapter>('/subchapters/', data, token || undefined);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['django-subchapters', data.chapter] });
    }
  });
}

// Hooks for study materials
export function useStudyMaterialsBySubchapter(subchapterId: number): UseQueryResult<StudyMaterial[]> {
  const { token } = useDjangoAuth();
  
  return useQuery({
    queryKey: ['django-materials', subchapterId],
    queryFn: djangoApi.getQueryFn<StudyMaterial[]>(`/materials/?subchapter_id=${subchapterId}`, token || undefined),
    enabled: !!subchapterId
  });
}

export function useStudyMaterial(materialId: number): UseQueryResult<StudyMaterialDetail> {
  const { token } = useDjangoAuth();
  
  return useQuery({
    queryKey: ['django-material', materialId],
    queryFn: djangoApi.getQueryFn<StudyMaterialDetail>(`/materials/${materialId}/`, token || undefined),
    enabled: !!materialId
  });
}

export function useUploadStudyMaterial() {
  const { token } = useDjangoAuth();
  
  return useMutation({
    mutationFn: async ({ 
      formData, 
      subchapterId 
    }: { 
      formData: FormData; 
      subchapterId: number 
    }) => {
      // Make sure the subchapterId is included in the formData
      formData.append('subchapter_id', subchapterId.toString());
      
      const response = await djangoApi.upload<StudyMaterial>('/materials/', formData, token || undefined);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['django-materials', data.subchapter] });
    }
  });
}

export function useDeleteStudyMaterial() {
  const { token } = useDjangoAuth();
  
  return useMutation({
    mutationFn: async ({ materialId, subchapterId }: { materialId: number; subchapterId: number }) => {
      const response = await djangoApi.post<{ success: boolean }>(`/materials/${materialId}/delete/`, {}, token || undefined);
      if (!response.success) {
        throw new Error(response.error);
      }
      return { materialId, subchapterId };
    },
    onSuccess: ({ subchapterId }) => {
      queryClient.invalidateQueries({ queryKey: ['django-materials', subchapterId] });
    }
  });
}

// Hooks for quizzes
export function useQuizzesByMaterial(materialId: number): UseQueryResult<Quiz[]> {
  const { token } = useDjangoAuth();
  
  return useQuery({
    queryKey: ['django-quizzes', materialId],
    queryFn: djangoApi.getQueryFn<Quiz[]>(`/quizzes/?material_id=${materialId}`, token || undefined),
    enabled: !!materialId
  });
}

export function useQuiz(quizId: number): UseQueryResult<QuizDetail> {
  const { token } = useDjangoAuth();
  
  return useQuery({
    queryKey: ['django-quiz', quizId],
    queryFn: djangoApi.getQueryFn<QuizDetail>(`/quizzes/${quizId}/`, token || undefined),
    enabled: !!quizId
  });
}

export function useGenerateQuiz() {
  const { token } = useDjangoAuth();
  
  return useMutation({
    mutationFn: async ({ materialId, level }: { materialId: number; level: string }) => {
      const response = await djangoApi.post<Quiz>(`/generate-quiz/${materialId}/`, { level }, token || undefined);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['django-quizzes', data.material] });
    }
  });
}

export function useSubmitQuizScore() {
  const { token } = useDjangoAuth();
  
  return useMutation({
    mutationFn: async ({ 
      quizId, 
      score, 
      timeTaken, 
      answers 
    }: { 
      quizId: number; 
      score: number; 
      timeTaken: string; 
      answers: any[] 
    }) => {
      const response = await djangoApi.post<QuizScore>(
        `/quiz-scores/`, 
        { quiz: quizId, score, time_taken: timeTaken, answers },
        token || undefined
      );
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data!;
    }
  });
}

// Hooks for leaderboard
export function useMaterialLeaderboard(materialId: number): UseQueryResult<QuizScore[]> {
  const { token } = useDjangoAuth();
  
  return useQuery({
    queryKey: ['django-leaderboard', materialId],
    queryFn: djangoApi.getQueryFn<QuizScore[]>(`/leaderboard/material/${materialId}/`, token || undefined),
    enabled: !!materialId
  });
}

// Hooks for recommendations
export function useStudyRecommendations(): UseQueryResult<StudyRecommendation[]> {
  const { token, isAuthenticated } = useDjangoAuth();
  
  return useQuery({
    queryKey: ['django-recommendations'],
    queryFn: djangoApi.getQueryFn<StudyRecommendation[]>('/recommendations/', token || undefined),
    enabled: isAuthenticated
  });
}

// Hooks for student report
export function useStudentReport(): UseQueryResult<any> {
  const { token, isAuthenticated } = useDjangoAuth();
  
  return useQuery({
    queryKey: ['django-student-report'],
    queryFn: djangoApi.getQueryFn<any>('/student-report/', token || undefined),
    enabled: isAuthenticated
  });
}