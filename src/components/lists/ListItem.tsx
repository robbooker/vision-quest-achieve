import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ListItem as ListItemType } from "@/hooks/useListItems";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { Trash2, GripVertical, Check, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractUrls, useLinkMetadata } from "@/hooks/useLinkMetadata";

interface ListItemProps {
  item: ListItemType;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string, linkMetadata?: {
    link_url: string | null;
    link_title: string | null;
    link_description: string | null;
    link_image: string | null;
  }) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
  readOnly?: boolean;
}

export function ListItemComponent({ 
  item, 
  onToggle, 
  onDelete, 
  onUpdate,
  isDragging,
  dragHandleProps,
  readOnly = false,
}: ListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { fetchMetadata } = useLinkMetadata();

  // Auto-resize textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [isEditing, editContent]);

  const handleSave = async () => {
    if (!editContent.trim()) {
      setEditContent(item.content);
      setIsEditing(false);
      return;
    }

    const newContent = editContent.trim();
    const urls = extractUrls(newContent);
    const firstUrl = urls[0] || null;
    
    // Check if URL changed or is new
    const urlChanged = firstUrl !== item.link_url;
    
    if (firstUrl && urlChanged) {
      // Fetch new metadata
      setIsFetchingMetadata(true);
      const metadata = await fetchMetadata(firstUrl);
      setIsFetchingMetadata(false);
      
      onUpdate(item.id, newContent, {
        link_url: firstUrl,
        link_title: metadata?.title || null,
        link_description: metadata?.description || null,
        link_image: metadata?.image || null,
      });
    } else if (!firstUrl && item.link_url) {
      // URL was removed, clear metadata
      onUpdate(item.id, newContent, {
        link_url: null,
        link_title: null,
        link_description: null,
        link_image: null,
      });
    } else {
      // No URL change, just update content
      onUpdate(item.id, newContent);
    }
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(item.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      handleCancel();
    }
    // Ctrl/Cmd + Enter to save
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // Get first URL for preview
  const displayUrl = item.link_url || extractUrls(item.content)[0];

  return (
    <div 
      className={cn(
        "group relative rounded-lg border bg-card p-4 transition-all",
        isDragging && "opacity-50 shadow-lg",
        !isEditing && !readOnly && "hover:border-border/80"
      )}
    >
      {/* Drag handle - only visible on hover */}
      {!readOnly && !isEditing && (
        <div 
          {...dragHandleProps} 
          className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div className={cn("space-y-2", !readOnly && "pl-4")}>
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none"
              placeholder="Write a note..."
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isFetchingMetadata}>
                <Check className="h-4 w-4 mr-1" />
                {isFetchingMetadata ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className={cn(
              "cursor-pointer",
              !readOnly && "hover:bg-accent/30 -m-2 p-2 rounded"
            )}
            onClick={() => !readOnly && setIsEditing(true)}
          >
            {/* Content with preserved line breaks */}
            <p className={cn(
              "text-sm whitespace-pre-wrap leading-relaxed",
              item.is_completed && "line-through text-muted-foreground"
            )}>
              {item.content}
            </p>

            {/* Contributor badge */}
            {item.contributor_name && (
              <Badge variant="secondary" className="text-xs gap-1 mt-2">
                <User className="h-3 w-3" />
                Added by {item.contributor_name}
              </Badge>
            )}

            {/* Link preview */}
            {displayUrl && (
              <div onClick={(e) => e.stopPropagation()}>
                <LinkPreviewCard
                  url={displayUrl}
                  title={item.link_title}
                  description={item.link_description}
                  image={item.link_image}
                  isLoading={isFetchingMetadata}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons - only visible on hover */}
      {!readOnly && !isEditing && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
