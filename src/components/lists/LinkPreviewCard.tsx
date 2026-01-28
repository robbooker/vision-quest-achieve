import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LinkPreviewCardProps {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  isLoading?: boolean;
}

export function LinkPreviewCard({ 
  url, 
  title, 
  description, 
  image,
  isLoading = false,
}: LinkPreviewCardProps) {
  // Extract domain from URL for display
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = url;
  }

  if (isLoading) {
    return (
      <div className="mt-3 border rounded-lg p-3 bg-muted/30">
        <div className="flex gap-3">
          <Skeleton className="w-20 h-20 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // If no metadata at all, just show URL fallback
  if (!title && !description && !image) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">{url}</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block border rounded-lg overflow-hidden hover:bg-accent/50 transition-colors"
    >
      <div className="flex">
        {image && (
          <div className="w-20 h-20 flex-shrink-0 bg-muted">
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image on error
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1 p-3 min-w-0">
          {title && (
            <p className="text-sm font-medium truncate flex items-center gap-1.5">
              <span className="truncate">{title}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
            </p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {description}
            </p>
          )}
          <p className="text-xs text-muted-foreground/70 mt-1">
            {domain}
          </p>
        </div>
      </div>
    </a>
  );
}
