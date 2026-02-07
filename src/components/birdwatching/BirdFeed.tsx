import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { 
  Bird, 
  Camera, 
  MapPin, 
  Calendar, 
  Plus, 
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { useBirdFeed, BirdFeedPost } from '@/hooks/useBirdFeed';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function BirdFeed() {
  const { user } = useAuth();
  const { posts, isLoading, createPost, toggleLike, deletePost } = useBirdFeed();
  const [showNewPost, setShowNewPost] = useState(false);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        // Reverse geocode
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const state = data.address?.state || '';
          setLocationName([city, state].filter(Boolean).join(', '));
        } catch {
          setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setIsGettingLocation(false);
      },
      () => setIsGettingLocation(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await createPost.mutateAsync({
      file: selectedFile,
      caption: caption || undefined,
      location_name: locationName || undefined,
      latitude: coords?.lat,
      longitude: coords?.lng,
    });
    // Reset form
    setShowNewPost(false);
    setCaption('');
    setLocationName('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setCoords(null);
  };

  const handleCancelNewPost = () => {
    setShowNewPost(false);
    setCaption('');
    setLocationName('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setCoords(null);
  };

  const lightboxImages = posts.map(p => ({ url: p.photo_url, alt: p.caption || 'Bird photo' }));
  const selectedPost = selectedPhotoIndex !== null ? posts[selectedPhotoIndex] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* New Post Button / Form */}
      {user && (
        <Card>
          <CardContent className="p-4">
            {!showNewPost ? (
              <Button 
                onClick={() => setShowNewPost(true)} 
                variant="outline" 
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Share a Bird Photo
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Photo Upload */}
                {!previewUrl ? (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Tap to select a photo</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full rounded-lg object-cover max-h-64"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Caption */}
                <Textarea
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={2}
                />

                {/* Location */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Location"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleGetLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelNewPost}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!selectedFile || createPost.isPending}
                    className="flex-1"
                  >
                    {createPost.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Post
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feed Posts */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bird className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Posts Yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Be the first to share a bird photo in the feed!
            </p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post, index) => (
          <FeedPostCard
            key={post.id}
            post={post}
            isOwnPost={post.user_id === user?.id}
            onLike={() => toggleLike.mutate(post.id)}
            onDelete={() => deletePost.mutate(post.id)}
            onPhotoClick={() => setSelectedPhotoIndex(index)}
            isLiking={toggleLike.isPending}
          />
        ))
      )}

      {/* Lightbox */}
      <ImageLightbox
        imageUrl={selectedPost?.photo_url || null}
        alt={selectedPost?.caption || 'Bird photo'}
        onClose={() => setSelectedPhotoIndex(null)}
        images={lightboxImages}
        currentIndex={selectedPhotoIndex ?? 0}
        onNavigate={setSelectedPhotoIndex}
      />
    </div>
  );
}

interface FeedPostCardProps {
  post: BirdFeedPost;
  isOwnPost: boolean;
  onLike: () => void;
  onDelete: () => void;
  onPhotoClick: () => void;
  isLiking: boolean;
}

function FeedPostCard({ post, isOwnPost, onLike, onDelete, onPhotoClick, isLiking }: FeedPostCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bird className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium text-sm">{post.author_name}</span>
        </div>
        {isOwnPost && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Photo */}
      <div 
        className="aspect-square cursor-pointer"
        onClick={onPhotoClick}
      >
        <img
          src={post.photo_url}
          alt={post.caption || 'Bird photo'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Actions & Info */}
      <CardContent className="p-4 space-y-2">
        {/* Like button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLike}
            disabled={isLiking}
            className={cn(
              "transition-transform hover:scale-110 active:scale-95",
              post.user_has_liked && "text-primary"
            )}
          >
            <Bird 
              className={cn(
                "h-6 w-6",
                post.user_has_liked ? "fill-primary text-primary" : "text-foreground"
              )} 
            />
          </button>
          {post.likes_count > 0 && (
            <span className="text-sm font-medium">
              {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
            </span>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm">
            <span className="font-medium">{post.author_name}</span>{' '}
            {post.caption}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(post.posted_at), 'MMM d, yyyy')}
          </span>
          {post.location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {post.location_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
