import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  year_published: number | null;
  started_at: string;
  finished_at: string | null;
  status: 'reading' | 'finished' | 'abandoned';
  notes: string | null;
  ranking: number | null;
  operational_change: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookInput {
  title: string;
  author: string;
  year_published?: number | null;
  started_at?: string;
  category?: string | null;
}

export interface UpdateBookInput {
  id: string;
  notes?: string | null;
  category?: string | null;
}

export interface ArchiveBookInput {
  id: string;
  ranking: number;
  operational_change: string;
  finished_at?: string;
}

export const useBooks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Book[];
    },
    enabled: !!user?.id,
  });

  const activeBooks = books.filter(b => b.status === 'reading');
  const archivedBooks = books.filter(b => b.status === 'finished');

  const createBook = useMutation({
    mutationFn: async (input: CreateBookInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title: input.title,
          author: input.author,
          year_published: input.year_published || null,
          started_at: input.started_at || new Date().toISOString().split('T')[0],
          category: input.category || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('New record filed');
    },
    onError: (error) => {
      toast.error('Failed to create book record');
      console.error(error);
    },
  });

  const updateBook = useMutation({
    mutationFn: async (input: UpdateBookInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('books')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error) => {
      toast.error('Failed to update book');
      console.error(error);
    },
  });

  const archiveBook = useMutation({
    mutationFn: async (input: ArchiveBookInput) => {
      const { data, error } = await supabase
        .from('books')
        .update({
          status: 'finished' as const,
          ranking: input.ranking,
          operational_change: input.operational_change,
          finished_at: input.finished_at || new Date().toISOString().split('T')[0],
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book archived successfully');
    },
    onError: (error) => {
      toast.error('Failed to archive book');
      console.error(error);
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete book');
      console.error(error);
    },
  });

  return {
    books,
    activeBooks,
    archivedBooks,
    isLoading,
    error,
    createBook,
    updateBook,
    archiveBook,
    deleteBook,
  };
};
