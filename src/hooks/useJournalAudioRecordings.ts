import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AudioMetadata {
  mood?: string;
  energyLevel?: number;
  keyThemes?: string[];
  highlights?: { text: string; significance: string }[];
  suggestedPrompt?: string;
  transcribedAt?: string;
}

export interface JournalAudioRecording {
  id: string;
  journal_entry_id: string;
  user_id: string;
  audio_url: string;
  audio_transcript: string | null;
  audio_duration_seconds: number | null;
  audio_metadata: AudioMetadata | null;
  created_at: string;
  updated_at: string;
}

export function useJournalAudioRecordings(entryId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['journal-audio-recordings', entryId],
    queryFn: async () => {
      if (!user?.id || !entryId) return [];

      const { data, error } = await supabase
        .from('journal_audio_recordings')
        .select('*')
        .eq('journal_entry_id', entryId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(rec => ({
        ...rec,
        audio_metadata: rec.audio_metadata as AudioMetadata | null,
      })) as JournalAudioRecording[];
    },
    enabled: !!user?.id && !!entryId,
  });
}

export function useCreateAudioRecording() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      blob,
    }: {
      entryId: string;
      blob: Blob;
    }): Promise<{ recordingId: string; storageUrl: string }> => {
      if (!user?.id) throw new Error('Not authenticated');

      const ext = blob.type.includes('webm') ? 'webm' : 'm4a';
      const recordingId = crypto.randomUUID();
      const fileName = `${user.id}/${entryId}-${recordingId}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('journal-audio')
        .upload(fileName, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Create storage URL for the edge function
      const storageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/sign/journal-audio/${fileName}`;

      // Create the audio recording record
      const { data, error } = await supabase
        .from('journal_audio_recordings')
        .insert({
          id: recordingId,
          journal_entry_id: entryId,
          user_id: user.id,
          audio_url: storageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      return { recordingId: data.id, storageUrl };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal-audio-recordings', variables.entryId] });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload audio');
    },
  });
}

export function useTranscribeAudioRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recordingId,
      audioUrl,
      entryId,
    }: {
      recordingId: string;
      audioUrl: string;
      entryId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl, recordingId, entryId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Transcription failed');

      return data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal-audio-recordings', variables.entryId] });
      toast.success(`Transcribed successfully! Detected mood: ${result.mood}`, {
        description: `${result.keyThemes?.length || 0} themes identified`,
      });
    },
    onError: (error) => {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio');
    },
  });
}

export function useDeleteAudioRecording() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordingId, entryId }: { recordingId: string; entryId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get the recording to find the audio path
      const { data: recording } = await supabase
        .from('journal_audio_recordings')
        .select('audio_url')
        .eq('id', recordingId)
        .eq('user_id', user.id)
        .single();

      if (recording?.audio_url) {
        // Extract file path from URL
        const match = recording.audio_url.match(/journal-audio\/(.+?)(\?|$)/);
        if (match) {
          await supabase.storage.from('journal-audio').remove([match[1]]);
        }
      }

      // Delete the recording record
      const { error } = await supabase
        .from('journal_audio_recordings')
        .delete()
        .eq('id', recordingId)
        .eq('user_id', user.id);

      if (error) throw error;

      return { entryId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['journal-audio-recordings', result.entryId] });
      toast.success('Audio recording removed');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete audio');
    },
  });
}
