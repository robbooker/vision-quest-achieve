import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { List } from "@/hooks/useLists";
import { useListItems, ListItem } from "@/hooks/useListItems";
import { ShareListDialog } from "./ShareListDialog";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { extractUrls, useLinkMetadata } from "@/hooks/useLinkMetadata";
import { ArrowLeft, Share2, Trash2, Pencil, Check, X, User, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ListDetailProps {
  list: List;
  onBack: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
}

function NoteEntry({ 
  item, 
  onDelete, 
  onUpdate,
  isLast,
}: {
  item: ListItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string, linkMetadata?: {
    link_url: string | null;
    link_title: string | null;
    link_description: string | null;
    link_image: string | null;
  }) => void;
  isLast: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { fetchMetadata } = useLinkMetadata();

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing]);

  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editContent, isEditing]);

  const handleSave = async () => {
    if (!editContent.trim()) {
      // If content is empty, delete the entry
      onDelete(item.id);
      return;
    }

    const newContent = editContent.trim();
    const urls = extractUrls(newContent);
    const firstUrl = urls[0] || null;
    
    const urlChanged = firstUrl !== item.link_url;
    
    if (firstUrl && urlChanged) {
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
      onUpdate(item.id, newContent, {
        link_url: null,
        link_title: null,
        link_description: null,
        link_image: null,
      });
    } else {
      onUpdate(item.id, newContent);
    }
    
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setEditContent(item.content);
      setIsEditing(false);
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const displayUrl = item.link_url || extractUrls(item.content)[0];

  if (isEditing) {
    return (
      <div className="group relative">
        <Textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full border-none bg-transparent shadow-none resize-none focus-visible:ring-0 text-base leading-relaxed p-0 min-h-[28px]"
          placeholder="Write something..."
        />
      </div>
    );
  }

  return (
    <div 
      className="group relative cursor-text"
      onClick={() => setIsEditing(true)}
    >
      {/* Content */}
      <div className="markdown-content text-base leading-relaxed min-h-[28px]">
        <ReactMarkdown
          skipHtml={true}
          rehypePlugins={[rehypeSanitize]}
          components={{
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
        >
          {item.content}
        </ReactMarkdown>
      </div>

      {/* Contributor badge */}
      {item.contributor_name && (
        <Badge variant="outline" className="text-xs gap-1 mt-1 text-muted-foreground">
          <User className="h-3 w-3" />
          {item.contributor_name}
        </Badge>
      )}

      {/* Link preview */}
      {displayUrl && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <LinkPreviewCard
            url={displayUrl}
            title={item.link_title}
            description={item.link_description}
            image={item.link_image}
            isLoading={isFetchingMetadata}
          />
        </div>
      )}

      {/* Delete button on hover */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-8 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function ListDetail({ list, onBack, onDelete, onUpdateTitle }: ListDetailProps) {
  const { items, addItem, updateItem, deleteItem } = useListItems(list.id);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [newNote, setNewNote] = useState("");
  const newNoteRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize new note textarea
  useEffect(() => {
    if (newNoteRef.current) {
      newNoteRef.current.style.height = 'auto';
      newNoteRef.current.style.height = Math.max(newNoteRef.current.scrollHeight, 28) + 'px';
    }
  }, [newNote]);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== list.title) {
      onUpdateTitle(editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addItem.mutate({ content: newNote.trim() });
      setNewNote("");
    }
  };

  const handleNewNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Note paper */}
      <div className="bg-card border rounded-lg shadow-sm min-h-[60vh]">
        {/* Title section */}
        <div className="px-6 py-5 border-b">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setEditTitle(list.title);
                    setIsEditingTitle(false);
                  }
                }}
                onBlur={handleSaveTitle}
                className="text-2xl font-bold border-none shadow-none h-auto p-0 focus-visible:ring-0"
                autoFocus
              />
            </div>
          ) : (
            <h1 
              className="text-2xl font-bold cursor-text hover:text-primary/80 transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              {list.title}
            </h1>
          )}
          
          {/* Description/metadata */}
          {list.description && (
            <p className="text-muted-foreground text-sm mt-1">{list.description}</p>
          )}
        </div>

        {/* Note content area */}
        <div className="px-6 py-4">
          {/* Existing notes */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <NoteEntry
                key={item.id}
                item={item}
                onDelete={(id) => deleteItem.mutate(id)}
                onUpdate={(id, content, linkMetadata) => updateItem.mutate({ id, content, ...linkMetadata })}
                isLast={index === items.length - 1}
              />
            ))}
          </div>

          {/* New note input - always visible */}
          <div className={cn("mt-4", items.length > 0 && "pt-4 border-t border-dashed")}>
            <Textarea
              ref={newNoteRef}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleNewNoteKeyDown}
              onBlur={() => {
                if (newNote.trim()) handleAddNote();
              }}
              placeholder={items.length === 0 ? "Start writing..." : "Add more..."}
              className="w-full border-none bg-transparent shadow-none resize-none focus-visible:ring-0 text-base leading-relaxed p-0 min-h-[28px] placeholder:text-muted-foreground/50"
              disabled={addItem.isPending}
            />
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-muted-foreground">
                Press Enter to add • Shift+Enter for new line
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                      <Info className="h-3 w-3" />
                      Markdown
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs font-mono space-y-0.5 max-w-[200px]">
                    <p>**bold** → <strong>bold</strong></p>
                    <p>*italic* → <em>italic</em></p>
                    <p># Heading</p>
                    <p>- list item</p>
                    <p>`code`</p>
                    <p>[link](url)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Share dialog */}
      <ShareListDialog
        list={list}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{list.title}" and all its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
