import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Biomarker {
  name: string;
  value: number | string;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
  status: 'normal' | 'low' | 'high' | 'unknown';
  category: string;
}

export interface BloodworkReport {
  id: string;
  user_id: string;
  report_date: string;
  lab_name: string | null;
  pdf_url: string;
  raw_text: string | null;
  biomarkers: Biomarker[];
  ai_insights: string | null;
  created_at: string;
  updated_at: string;
}

export function useBloodwork() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['bloodwork-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('bloodwork_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(report => ({
        ...report,
        biomarkers: (report.biomarkers as unknown as Biomarker[]) || [],
      })) as BloodworkReport[];
    },
    enabled: !!user?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, reportDate }: { file: File; reportDate: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Upload PDF to storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bloodwork-pdfs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('bloodwork-pdfs')
        .getPublicUrl(uploadData.path);

      const pdfUrl = urlData.publicUrl;

      // Create report record
      const { data: reportData, error: reportError } = await supabase
        .from('bloodwork_reports')
        .insert({
          user_id: user.id,
          report_date: reportDate.toISOString().split('T')[0],
          pdf_url: pdfUrl,
          biomarkers: [],
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Call edge function to parse PDF
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('parse-bloodwork', {
        body: {
          pdf_url: pdfUrl,
          report_id: reportData.id,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error) {
        console.error('Parse error:', response.error);
        // Don't throw - the report is saved, parsing just failed
        toast.error('PDF uploaded but parsing failed. You can try re-processing later.');
      }

      return reportData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-reports'] });
      toast.success('Bloodwork report uploaded and analyzed!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload bloodwork report');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get report to find PDF path
      const { data: report } = await supabase
        .from('bloodwork_reports')
        .select('pdf_url')
        .eq('id', reportId)
        .single();

      // Delete from database
      const { error } = await supabase
        .from('bloodwork_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Try to delete from storage
      if (report?.pdf_url) {
        const pathParts = report.pdf_url.split('/bloodwork-pdfs/');
        if (pathParts.length > 1) {
          await supabase.storage
            .from('bloodwork-pdfs')
            .remove([pathParts[1]]);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodwork-reports'] });
      toast.success('Report deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete report');
    },
  });

  const latestReport = reports?.[0] || null;

  // Get all unique biomarkers across reports for trend tracking
  const allBiomarkerNames = Array.from(
    new Set(reports?.flatMap(r => r.biomarkers.map(b => b.name)) || [])
  );

  return {
    reports,
    latestReport,
    allBiomarkerNames,
    isLoading,
    uploadReport: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteReport: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
