import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecapPreview } from "@/components/recap/RecapPreview";
import { MonthlyRecap, RecapContent, RecapStats } from "@/hooks/useMonthlyRecap";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Lock, FileX } from "lucide-react";
import { format, parse } from "date-fns";

export default function PublicRecap() {
  const { slug } = useParams<{ slug: string }>();

  const { data: recap, isLoading, error } = useQuery({
    queryKey: ['public-recap', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');

      const { data, error } = await supabase
        .from('monthly_recaps')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .in('privacy', ['public', 'unlisted'])
        .single();

      if (error) throw error;
      if (!data) throw new Error('Recap not found');

      // Cast the JSONB fields
      return {
        ...data,
        content: data.content as unknown as RecapContent,
        stats: data.stats as unknown as RecapStats,
        charts_data: data.charts_data as unknown as any,
        photos: data.photos as unknown as any[],
      } as MonthlyRecap;
    },
    enabled: !!slug,
    retry: false,
  });

  // Increment view count on load
  useEffect(() => {
    const incrementView = async () => {
      if (recap?.id) {
        try {
          await supabase.rpc('increment_recap_view', { recap_id: recap.id });
        } catch (err) {
          console.error('Failed to increment view count:', err);
        }
      }
    };
    incrementView();
  }, [recap?.id]);

  const monthLabel = recap?.month 
    ? format(parse(recap.month + '-01', 'yyyy-MM-dd', new Date()), 'MMMM yyyy')
    : '';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading recap...</p>
        </div>
      </div>
    );
  }

  if (error || !recap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Helmet>
          <title>Recap Not Found</title>
        </Helmet>
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <FileX className="h-16 w-16 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Recap Not Found</h1>
            <p className="text-muted-foreground text-center">
              This recap doesn't exist or is not publicly available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{recap.headline || `${monthLabel} Recap`}</title>
        <meta name="description" content={recap.subheadline || `Monthly recap for ${monthLabel}`} />
        <meta property="og:title" content={recap.headline || `${monthLabel} Recap`} />
        <meta property="og:description" content={recap.subheadline || `Monthly recap for ${monthLabel}`} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="container max-w-4xl py-8 px-4">
        <div data-recap-preview>
          <RecapPreview recap={recap} />
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Created with{" "}
            <a 
              href="https://vision-quest-achieve.lovable.app" 
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vision Quest
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
