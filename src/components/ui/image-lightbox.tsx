import { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageLightboxProps {
  imageUrl: string | null;
  alt: string;
  onClose: () => void;
  // Optional navigation props
  images?: { url: string; alt: string }[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export const ImageLightbox = ({ 
  imageUrl, 
  alt, 
  onClose,
  images,
  currentIndex = 0,
  onNavigate 
}: ImageLightboxProps) => {
  const hasNavigation = images && images.length > 1 && onNavigate;
  
  const goToPrevious = useCallback(() => {
    if (!hasNavigation) return;
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    onNavigate(newIndex);
  }, [hasNavigation, currentIndex, images?.length, onNavigate]);

  const goToNext = useCallback(() => {
    if (!hasNavigation) return;
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    onNavigate(newIndex);
  }, [hasNavigation, currentIndex, images?.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!imageUrl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageUrl, goToPrevious, goToNext, onClose]);

  return (
    <Dialog open={!!imageUrl} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden>
        
        {imageUrl && (
          <div className="relative flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={onClose}
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Previous button */}
            {hasNavigation && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />

            {/* Next button */}
            {hasNavigation && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Photo counter */}
            {hasNavigation && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
