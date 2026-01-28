import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface ListItemFormProps {
  onAdd: (content: string) => void;
  isLoading?: boolean;
}

export function ListItemForm({ onAdd, isLoading }: ListItemFormProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(textareaRef.current.scrollHeight, 56) + 'px';
    }
  }, [content]);

  const handleSubmit = () => {
    if (content.trim()) {
      onAdd(content.trim());
      setContent("");
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = '56px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift saves
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Shift+Enter allows new lines (default behavior)
  };

  const handleBlur = () => {
    // Save on blur if there's content
    if (content.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Write a note... (Shift+Enter for new line)"
        disabled={isLoading}
        className="min-h-[56px] resize-none bg-muted/30 border-dashed"
        rows={1}
      />
    </div>
  );
}
