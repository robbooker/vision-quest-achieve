import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ReviewerSlug = 'user-1' | 'user-2';
export type Decision = 'keep' | 'discard';

export interface GraduationPhoto {
  id: string;
  storage_path: string;
  uploaded_by: string | null;
  assigned_to_user_1: boolean;
  assigned_to_user_2: boolean;
  created_at: string;
}

export interface GraduationPhotoDecision {
  id: string;
  photo_id: string;
  reviewer_slug: ReviewerSlug;
  decision: Decision;
  decided_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const photoUrl = (path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/graduation-photos/${path}`;

export function useGraduationPhotos() {
  return useQuery({
    queryKey: ['graduation-photos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('graduation_photos')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as GraduationPhoto[];
    },
  });
}

export function useGraduationDecisions() {
  return useQuery({
    queryKey: ['graduation-decisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('graduation_photo_decisions')
        .select('*');
      if (error) throw error;
      return data as GraduationPhotoDecision[];
    },
  });
}

export function useSetDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      photo_id,
      reviewer_slug,
      decision,
    }: {
      photo_id: string;
      reviewer_slug: ReviewerSlug;
      decision: Decision;
    }) => {
      const { error } = await supabase
        .from('graduation_photo_decisions')
        .upsert(
          { photo_id, reviewer_slug, decision, decided_at: new Date().toISOString() },
          { onConflict: 'photo_id,reviewer_slug' }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['graduation-decisions'] }),
  });
}

export function useUploadPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      files,
      assignUser1,
      assignUser2,
    }: {
      files: File[];
      assignUser1: boolean;
      assignUser2: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('graduation-photos')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from('graduation_photos').insert({
          storage_path: path,
          uploaded_by: userId,
          assigned_to_user_1: assignUser1,
          assigned_to_user_2: assignUser2,
        });
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['graduation-photos'] }),
  });
}

export function useUpdatePhotoAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      assigned_to_user_1,
      assigned_to_user_2,
    }: {
      id: string;
      assigned_to_user_1: boolean;
      assigned_to_user_2: boolean;
    }) => {
      const { error } = await supabase
        .from('graduation_photos')
        .update({ assigned_to_user_1, assigned_to_user_2 })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['graduation-photos'] }),
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: GraduationPhoto) => {
      await supabase.storage.from('graduation-photos').remove([photo.storage_path]);
      const { error } = await supabase.from('graduation_photos').delete().eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['graduation-photos'] });
      qc.invalidateQueries({ queryKey: ['graduation-decisions'] });
    },
  });
}
