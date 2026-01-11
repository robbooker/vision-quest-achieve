import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ImageLightboxProps {
  imageUrl: string | null;
  alt: string;
  onClose: () => void;
}

export const ImageLightbox = ({ imageUrl, alt, onClose }: ImageLightboxProps) => {
  return (
    <Dialog open={!!imageUrl} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-transparent shadow-none">
        <VisuallyHidden>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg cursor-pointer"
            onClick={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
