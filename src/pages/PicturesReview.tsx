import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  useGraduationPhotos,
  useGraduationDecisions,
  useSetDecision,
  photoUrl,
  type ReviewerSlug,
} from '@/hooks/useGraduationPhotos';
import { Check, X, ChevronLeft, ChevronRight, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type Filter = 'all' | 'undecided' | 'keep' | 'discard';

const REVIEWER_NAMES: Record<ReviewerSlug, string> = {
  'user-1': 'Brittney',
  'user-2': 'User 2',
};

export default function PicturesReview() {
  const { userSlug } = useParams<{ userSlug: string }>();
  const slug = (userSlug === 'user-1' || userSlug === 'user-2' ? userSlug : null) as ReviewerSlug | null;

  const { data: photos = [], isLoading } = useGraduationPhotos();
  const { data: decisions = [] } = useGraduationDecisions();
  const setDecision = useSetDecision();

  const [filter, setFilter] = useState<Filter>('all');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [zipping, setZipping] = useState(false);

  const myPhotos = useMemo(() => {
    if (!slug) return [];
    return photos.filter((p) =>
      slug === 'user-1' ? p.assigned_to_user_1 : p.assigned_to_user_2
    );
  }, [photos, slug]);

  const decisionMap = useMemo(() => {
    const m = new Map<string, 'keep' | 'discard'>();
    for (const d of decisions) {
      if (d.reviewer_slug === slug) m.set(d.photo_id, d.decision);
    }
    return m;
  }, [decisions, slug]);

  const filtered = useMemo(() => {
    return myPhotos.filter((p) => {
      const d = decisionMap.get(p.id);
      if (filter === 'all') return true;
      if (filter === 'undecided') return !d;
      return d === filter;
    });
  }, [myPhotos, decisionMap, filter]);

  const reviewedCount = useMemo(
    () => myPhotos.filter((p) => decisionMap.has(p.id)).length,
    [myPhotos, decisionMap]
  );
  const keepCount = useMemo(
    () => myPhotos.filter((p) => decisionMap.get(p.id) === 'keep').length,
    [myPhotos, decisionMap]
  );

  const decide = useCallback(
    (photoId: string, decision: 'keep' | 'discard') => {
      if (!slug) return;
      setDecision.mutate({ photo_id: photoId, reviewer_slug: slug, decision });
    },
    [slug, setDecision]
  );

  const downloadOne = useCallback(async (path: string) => {
    try {
      const res = await fetch(photoUrl(path));
      const blob = await res.blob();
      saveAs(blob, path.split('/').pop() || 'photo.jpg');
    } catch {
      toast.error('Download failed');
    }
  }, []);

  const downloadKeeps = useCallback(async () => {
    const keeps = myPhotos.filter((p) => decisionMap.get(p.id) === 'keep');
    if (keeps.length === 0) {
      toast.info('No keeps yet');
      return;
    }
    setZipping(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        keeps.map(async (p) => {
          const res = await fetch(photoUrl(p.storage_path));
          const blob = await res.blob();
          zip.file(p.storage_path.split('/').pop() || `${p.id}.jpg`, blob);
        })
      );
      const out = await zip.generateAsync({ type: 'blob' });
      saveAs(out, `${slug}-keeps.zip`);
    } catch {
      toast.error('ZIP failed');
    } finally {
      setZipping(false);
    }
  }, [myPhotos, decisionMap, slug]);

  // Keyboard nav in lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      else if (e.key === 'ArrowLeft') setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)));
      else if (e.key === 'ArrowRight')
        setLightboxIdx((i) => (i === null ? null : Math.min(filtered.length - 1, i + 1)));
      else if ((e.key === 'k' || e.key === 'K') && filtered[lightboxIdx]) {
        decide(filtered[lightboxIdx].id, 'keep');
      } else if ((e.key === 'd' || e.key === 'D') && filtered[lightboxIdx]) {
        decide(filtered[lightboxIdx].id, 'discard');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, filtered, decide]);

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Unknown user.</p>
      </div>
    );
  }

  const current = lightboxIdx !== null ? filtered[lightboxIdx] : null;
  const currentDecision = current ? decisionMap.get(current.id) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{REVIEWER_NAMES[slug]}'s Photos</title>
      </Helmet>

      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/pictures"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{REVIEWER_NAMES[slug]}'s Photos</h1>
              <p className="text-xs text-muted-foreground">
                {reviewedCount} of {myPhotos.length} reviewed · {keepCount} keeps
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadKeeps} disabled={zipping || keepCount === 0} size="sm">
              {zipping ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              Download Keeps ({keepCount})
            </Button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3 space-y-2">
          <Progress value={myPhotos.length ? (reviewedCount / myPhotos.length) * 100 : 0} className="h-1.5" />
          <div className="flex gap-2 flex-wrap">
            {(['all', 'undecided', 'keep', 'discard'] as Filter[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {myPhotos.length === 0 ? 'No photos assigned to you yet.' : 'No photos match this filter.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((p, idx) => {
              const d = decisionMap.get(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => setLightboxIdx(idx)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                >
                  <img
                    src={photoUrl(p.storage_path)}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {d && (
                    <Badge
                      className={`absolute top-2 right-2 ${
                        d === 'keep' ? 'bg-green-600' : 'bg-red-600'
                      } text-white border-0`}
                    >
                      {d === 'keep' ? 'Keep' : 'Discard'}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {current && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={() => setLightboxIdx(null)}
        >
          <div className="flex justify-between items-center p-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm opacity-80">
              {(lightboxIdx ?? 0) + 1} / {filtered.length}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => downloadOne(current.storage_path)}>
                <Download className="h-4 w-4 mr-1" />Download
              </Button>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setLightboxIdx(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 relative" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-2 text-white hover:bg-white/10 h-12 w-12"
              disabled={lightboxIdx === 0}
              onClick={() => setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)))}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <img
              src={photoUrl(current.storage_path)}
              alt=""
              className="max-h-[75vh] max-w-full object-contain"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 text-white hover:bg-white/10 h-12 w-12"
              disabled={lightboxIdx === filtered.length - 1}
              onClick={() => setLightboxIdx((i) => (i === null ? null : Math.min(filtered.length - 1, i + 1)))}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>

          <div className="p-6 flex justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            <Button
              size="lg"
              variant={currentDecision === 'discard' ? 'default' : 'outline'}
              className={currentDecision === 'discard' ? 'bg-red-600 hover:bg-red-700' : 'text-white border-white/40 hover:bg-white/10'}
              onClick={() => decide(current.id, 'discard')}
            >
              <X className="h-5 w-5 mr-2" />Discard
            </Button>
            <Button
              size="lg"
              variant={currentDecision === 'keep' ? 'default' : 'outline'}
              className={currentDecision === 'keep' ? 'bg-green-600 hover:bg-green-700' : 'text-white border-white/40 hover:bg-white/10'}
              onClick={() => decide(current.id, 'keep')}
            >
              <Check className="h-5 w-5 mr-2" />Keep
            </Button>
          </div>
          <p className="text-center text-xs text-white/50 pb-4">
            ← → navigate · K keep · D discard · Esc close
          </p>
        </div>
      )}
    </div>
  );
}
