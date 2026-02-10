import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Save, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { useIsMobile } from "@/hooks/use-mobile";

interface FullscreenNoteEditorProps {
  note: { id: string; content: string };
  onSave: (id: string, content: string) => void;
  onClose: () => void;
  initialMode?: "edit" | "preview";
}

export function FullscreenNoteEditor({
  note,
  onSave,
  onClose,
  initialMode = "edit",
}: FullscreenNoteEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">(initialMode);
  const [content, setContent] = useState(note.content);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef<{ scrollTop: number; selectionStart: number; selectionEnd: number }>({
    scrollTop: 0,
    selectionStart: 0,
    selectionEnd: 0,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const savedContentRef = useRef(note.content);
  const isMobile = useIsMobile();

  contentRef.current = content;

  const flushSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (contentRef.current !== savedContentRef.current) {
      onSave(note.id, contentRef.current);
      savedContentRef.current = contentRef.current;
      setSaveStatus("saved");
    }
  }, [note.id, onSave]);

  // Auto-save debounce
  useEffect(() => {
    if (content === savedContentRef.current) return;
    setSaveStatus("saving");
    debounceRef.current = setTimeout(() => {
      onSave(note.id, content);
      savedContentRef.current = content;
      setSaveStatus("saved");
      debounceRef.current = null;
    }, 2000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, note.id, onSave]);

  // Flush on unmount
  useEffect(() => {
    return () => flushSave();
  }, [flushSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        flushSave();
        onClose();
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        flushSave();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flushSave, onClose]);

  // Store cursor position before switching to preview
  const handleModeSwitch = (newMode: "edit" | "preview") => {
    if (mode === "edit" && textareaRef.current) {
      cursorRef.current = {
        scrollTop: textareaRef.current.scrollTop,
        selectionStart: textareaRef.current.selectionStart,
        selectionEnd: textareaRef.current.selectionEnd,
      };
    }
    setMode(newMode);
  };

  // Restore cursor position when switching back to edit
  useEffect(() => {
    if (mode === "edit" && textareaRef.current) {
      const ta = textareaRef.current;
      requestAnimationFrame(() => {
        ta.focus();
        ta.scrollTop = cursorRef.current.scrollTop;
        ta.setSelectionRange(cursorRef.current.selectionStart, cursorRef.current.selectionEnd);
      });
    }
  }, [mode]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const isWide = false; // Split view disabled — always single-pane

  const handleSaveAndClose = () => {
    flushSave();
    onClose();
  };

  const previewContent = (
    <div className="fullscreen-note-preview markdown-content">
      <ReactMarkdown
        skipHtml
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return createPortal(
    <div className="fullscreen-note-overlay">
      {/* Header */}
      <div className="fullscreen-note-header">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Segmented toggle */}
          <div className="fullscreen-mode-toggle">
            <button
              type="button"
              className={cn("fullscreen-mode-btn", mode === "edit" && "fullscreen-mode-btn-active")}
              onClick={() => handleModeSwitch("edit")}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </button>
            <button
              type="button"
              className={cn("fullscreen-mode-btn", mode === "preview" && "fullscreen-mode-btn-active")}
              onClick={() => handleModeSwitch("preview")}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <Button variant="outline" size="sm" onClick={handleSaveAndClose}>
              <Save className="h-4 w-4 mr-1" />
              Save & Close
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleSaveAndClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Toolbar - always visible in edit mode */}
      {mode === "edit" && (
        <div className="px-4">
          <MarkdownToolbar textareaRef={textareaRef} onChange={setContent} visible={true} />
        </div>
      )}

      {/* Main content */}
      <div className="fullscreen-note-body">
        {mode === "edit" && isWide ? (
          // Split view on wide screens
          <div className="fullscreen-split-view">
            <div className="flex-1 min-w-0 h-full">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="fullscreen-note-textarea"
                placeholder="Start writing..."
              />
            </div>
            <div className="fullscreen-split-divider" />
            <div className="flex-1 min-w-0 h-full overflow-auto p-6">
              {previewContent}
            </div>
          </div>
        ) : mode === "edit" ? (
          // Edit only on narrow screens
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="fullscreen-note-textarea"
            placeholder="Start writing..."
          />
        ) : (
          // Preview mode
          <div className="h-full overflow-auto p-6">{previewContent}</div>
        )}
      </div>

      {/* Footer */}
      <div className="fullscreen-note-footer">
        <span>
          {wordCount} {wordCount === 1 ? "word" : "words"} · {charCount}{" "}
          {charCount === 1 ? "char" : "chars"}
        </span>
        <span>
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved ✓"}
        </span>
      </div>
    </div>,
    document.body
  );
}
