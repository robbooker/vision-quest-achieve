import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  useGraduationPhotos,
  useGraduationDecisions,
  useUploadPhotos,
  useUpdatePhotoAssignment,
  useDeletePhoto,
  photoUrl,
  type GraduationPhoto,
  type ReviewerSlug,
} from '@/hooks/useGraduationPhotos';
import { Upload, Trash2, Loader2, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const REVIEWER_NAMES: Record<ReviewerSlug, string> = {
  'user-1': 'Brittney',
  'user-2': 'Valeria',
  'user-3': 'N',
};

export default function PicturesAdmin() {
  const { data: photos = [], isLoading } = useGraduationPhotos();
  const { data: decisions = [] } = useGraduationDecisions();
  const upload = useUploadPhotos();
  const updateAssign = useUpdatePhotoAssignment();
  const del = useDeletePhoto();
  const fileInput = useRef<HTMLInputElement>(null);

  const [assignU1, setAssignU1] = useState(true);
  const [assignU2, setAssignU2] = useState(true);
  const [assignU3, setAssignU3] = useState(true);
  const [zipping, setZipping] = useState<ReviewerSlug | null>(null);

  const decisionLookup = useMemo(() => {
    const m = new Map<string, Partial<Record<ReviewerSlug, 'keep' | 'discard'>>>();
    for (const d of decisions) {
      const cur = m.get(d.photo_id) || {};
      cur[d.reviewer_slug as ReviewerSlug] = d.decision as 'keep' | 'discard';
      m.set(d.photo_id, cur);
    }
    return m;
  }, [decisions]);

  const summary = (slug: ReviewerSlug) => {
    const assigned = photos.filter((p) =>
      slug === 'user-1' ? p.assigned_to_user_1 :
      slug === 'user-2' ? p.assigned_to_user_2 :
      p.assigned_to_user_3
    );
    let keep = 0, discard = 0;
    for (const p of assigned) {
      const d = decisionLookup.get(p.id)?.[slug];
      if (d === 'keep') keep++;
      else if (d === 'discard') discard++;
    }
    return { total: assigned.length, keep, discard, undecided: assigned.length - keep - discard };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!assignU1 && !assignU2 && !assignU3) {
      toast.error('Pick at least one user to assign');
      return;
    }
    try {
      await upload.mutateAsync({
        files: Array.from(files),
        assignUser1: assignU1,
        assignUser2: assignU2,
        assignUser3: assignU3,
      });
      toast.success(`Uploaded ${files.length} photo(s)`);
      if (fileInput.current) fileInput.current.value = '';
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    }
  };

  const exportCsv = (slug: ReviewerSlug) => {
    const rows = [['filename', 'decision']];
    for (const p of photos) {
      const assigned = slug === 'user-1' ? p.assigned_to_user_1 : slug === 'user-2' ? p.assigned_to_user_2 : p.assigned_to_user_3;
      if (!assigned) continue;
      const d = decisionLookup.get(p.id)?.[slug] || 'undecided';
      rows.push([p.storage_path, d]);
    }
    const csv = rows.map((r) => r.join(',')).join('\n');
    saveAs(new Blob([csv], { type: 'text/csv' }), `${slug}-decisions.csv`);
  };

  const downloadKeepsZip = async (slug: ReviewerSlug) => {
    const keeps = photos.filter((p) => {
      const assigned = slug === 'user-1' ? p.assigned_to_user_1 : slug === 'user-2' ? p.assigned_to_user_2 : p.assigned_to_user_3;
      return assigned && decisionLookup.get(p.id)?.[slug] === 'keep';
    });
    if (keeps.length === 0) {
      toast.info('No keeps');
      return;
    }
    setZipping(slug);
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
    } finally {
      setZipping(null);
    }
  };

  const toggleAssign = (p: GraduationPhoto, which: ReviewerSlug) => {
    updateAssign.mutate({
      id: p.id,
      assigned_to_user_1: which === 'user-1' ? !p.assigned_to_user_1 : p.assigned_to_user_1,
      assigned_to_user_2: which === 'user-2' ? !p.assigned_to_user_2 : p.assigned_to_user_2,
      assigned_to_user_3: which === 'user-3' ? !p.assigned_to_user_3 : p.assigned_to_user_3,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Pictures Admin</title></Helmet>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Graduation Photos — Admin</h1>
            <p className="text-sm text-muted-foreground">Upload, assign, review.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/pictures"><ExternalLink className="h-4 w-4 mr-1" />Reviewer view</Link>
          </Button>
        </div>

        {/* Upload */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Upload Photos</h2>
          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={assignU1} onCheckedChange={(v) => setAssignU1(!!v)} />
              Assign to {REVIEWER_NAMES['user-1']} (User 1)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={assignU2} onCheckedChange={(v) => setAssignU2(!!v)} />
              Assign to {REVIEWER_NAMES['user-2']}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={assignU3} onCheckedChange={(v) => setAssignU3(!!v)} />
              Assign to {REVIEWER_NAMES['user-3']}
            </label>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button onClick={() => fileInput.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {upload.isPending ? 'Uploading...' : 'Choose files'}
          </Button>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['user-1', 'user-2', 'user-3'] as ReviewerSlug[]).map((slug) => {
            const s = summary(slug);
            return (
              <Card key={slug} className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{REVIEWER_NAMES[slug]}</h3>
                  <Badge variant="outline">{s.total} assigned</Badge>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-green-600">✓ {s.keep} keep</span>
                  <span className="text-red-600">✗ {s.discard} discard</span>
                  <span className="text-muted-foreground">· {s.undecided} undecided</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => exportCsv(slug)}>
                    <Download className="h-3.5 w-3.5 mr-1" />CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadKeepsZip(slug)} disabled={zipping === slug}>
                    {zipping === slug ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                    Keeps ZIP
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Library */}
        <div>
          <h2 className="font-semibold mb-3">Library ({photos.length})</h2>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : photos.length === 0 ? (
            <p className="text-muted-foreground text-sm">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((p) => {
                const d = decisionLookup.get(p.id) || {};
                return (
                  <Card key={p.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted relative">
                      <img src={photoUrl(p.storage_path)} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2 space-y-2 text-xs">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleAssign(p, 'user-1')}
                          className={`px-1.5 py-0.5 rounded border ${p.assigned_to_user_1 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted'}`}
                        >
                          U1 {d['user-1'] === 'keep' ? '✓' : d['user-1'] === 'discard' ? '✗' : ''}
                        </button>
                        <button
                          onClick={() => toggleAssign(p, 'user-2')}
                          className={`px-1.5 py-0.5 rounded border ${p.assigned_to_user_2 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted'}`}
                        >
                          U2 {d['user-2'] === 'keep' ? '✓' : d['user-2'] === 'discard' ? '✗' : ''}
                        </button>
                        <button
                          onClick={() => toggleAssign(p, 'user-3')}
                          className={`px-1.5 py-0.5 rounded border ${p.assigned_to_user_3 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted'}`}
                        >
                          U3 {d['user-3'] === 'keep' ? '✓' : d['user-3'] === 'discard' ? '✗' : ''}
                        </button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 ml-auto text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm('Delete this photo?')) del.mutate(p);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
