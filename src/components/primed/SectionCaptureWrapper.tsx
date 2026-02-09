import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SectionCaptureWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCaptureWrapper({ title, children, className }: SectionCaptureWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = async () => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          toast.success(`${title} copied to clipboard`);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Fallback: if clipboard image write isn't supported, copy text
          const text = ref.current?.innerText || '';
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success(`${title} text copied to clipboard`);
          setTimeout(() => setCopied(false), 2000);
        }
      }, 'image/png');
    } catch {
      // Final fallback: copy inner text
      const text = ref.current?.innerText || '';
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${title} text copied`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!ref.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success(`${title} downloaded`);
    } catch {
      toast.error('Failed to download image');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={cn("group relative", className)}>
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleCopy}
          title="Copy as image"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleDownload}
          disabled={downloading}
          title="Download as image"
        >
          <Download className={cn("h-3.5 w-3.5", downloading && "animate-pulse")} />
        </Button>
      </div>
      <div ref={ref}>
        {children}
      </div>
    </div>
  );
}
