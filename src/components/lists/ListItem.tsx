import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListItem as ListItemType } from "@/hooks/useListItems";
import { Trash2, GripVertical, ExternalLink, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListItemProps {
  item: ListItemType;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
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

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(item.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(item.content);
    setIsEditing(false);
  };

  // Check if content contains a URL
  const urlMatch = item.content.match(/https?:\/\/[^\s]+/);
  const hasLink = item.link_url || urlMatch;

  return (
    <div 
      className={cn(
        "group flex items-start gap-2 p-3 rounded-lg border bg-card",
        isDragging && "opacity-50",
        item.is_completed && "opacity-60"
      )}
    >
      {!readOnly && (
        <div {...dragHandleProps} className="cursor-grab mt-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <Checkbox
        checked={item.is_completed}
        onCheckedChange={(checked) => !readOnly && onToggle(item.id, !!checked)}
        disabled={readOnly}
        className="mt-1"
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              autoFocus
              className="h-8"
            />
            <Button size="sm" variant="ghost" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <p className={cn(
              "text-sm",
              item.is_completed && "line-through text-muted-foreground"
            )}>
              {item.content}
            </p>

            {/* Link preview */}
            {hasLink && item.link_title && (
              <a 
                href={item.link_url || urlMatch?.[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block border rounded-lg p-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex gap-3">
                  {item.link_image && (
                    <img 
                      src={item.link_image} 
                      alt="" 
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1">
                      {item.link_title}
                      <ExternalLink className="h-3 w-3" />
                    </p>
                    {item.link_description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.link_description}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            )}
          </>
        )}
      </div>

      {!readOnly && !isEditing && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
