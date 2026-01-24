import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Globe, Lock, Link2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MonthlyRecap } from "@/hooks/useMonthlyRecap";

interface RecapShareControlsProps {
  recap: MonthlyRecap;
  onPrivacyChange: (privacy: 'private' | 'unlisted' | 'public') => void;
  onSlugChange: (slug: string) => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

export function RecapShareControls({
  recap,
  onPrivacyChange,
  onSlugChange,
  onPublish,
  isPublishing = false,
}: RecapShareControlsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const shareUrl = recap.slug 
    ? `${baseUrl}/recap/${recap.slug}` 
    : null;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const generateSlug = () => {
    const monthSlug = recap.month.replace('-', '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${monthSlug}-${randomSuffix}`;
  };

  const privacyIcons = {
    private: <Lock className="h-4 w-4" />,
    unlisted: <Link2 className="h-4 w-4" />,
    public: <Globe className="h-4 w-4" />,
  };

  const privacyDescriptions = {
    private: "Only you can view this recap",
    unlisted: "Anyone with the link can view",
    public: "Listed publicly on your profile",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Share & Publish
          </CardTitle>
          {recap.status === 'published' && (
            <Badge variant="outline" className="gap-1">
              <Eye className="h-3 w-3" />
              {recap.view_count || 0} views
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Privacy Setting */}
        <div className="space-y-2">
          <Label>Privacy</Label>
          <Select
            value={recap.privacy || 'private'}
            onValueChange={(value) => onPrivacyChange(value as 'private' | 'unlisted' | 'public')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Private</span>
                </div>
              </SelectItem>
              <SelectItem value="unlisted">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  <span>Unlisted</span>
                </div>
              </SelectItem>
              <SelectItem value="public">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Public</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {privacyDescriptions[recap.privacy || 'private']}
          </p>
        </div>

        {/* Slug / Share Link */}
        {(recap.privacy === 'unlisted' || recap.privacy === 'public') && (
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input
                value={recap.slug || ''}
                onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="custom-link-slug"
                className="font-mono text-sm"
              />
              {!recap.slug && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSlugChange(generateSlug())}
                >
                  Generate
                </Button>
              )}
            </div>
            {shareUrl && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <code className="text-xs flex-1 truncate">{shareUrl}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Publish Button */}
        {recap.status !== 'published' && (recap.privacy === 'unlisted' || recap.privacy === 'public') && recap.slug && (
          <Button
            onClick={onPublish}
            disabled={isPublishing}
            className="w-full"
          >
            {isPublishing ? "Publishing..." : "Publish Recap"}
          </Button>
        )}

        {recap.status === 'published' && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">
              This recap is live and shareable
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
