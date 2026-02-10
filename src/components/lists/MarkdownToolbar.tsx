import React from "react";
import { cn } from "@/lib/utils";
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, Link, Quote } from "lucide-react";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  visible?: boolean;
}

type FormatConfig = {
  label: string;
  icon: React.ReactNode;
  ariaLabel: string;
} & (
  | { type: "wrap"; prefix: string; suffix: string; placeholder: string }
  | { type: "line"; prefix: string }
);

const formats: FormatConfig[] = [
  { type: "wrap", label: "B", icon: <Bold className="h-4 w-4" />, ariaLabel: "Bold", prefix: "**", suffix: "**", placeholder: "bold text" },
  { type: "wrap", label: "I", icon: <Italic className="h-4 w-4" />, ariaLabel: "Italic", prefix: "*", suffix: "*", placeholder: "italic text" },
  { type: "line", label: "H1", icon: <Heading1 className="h-4 w-4" />, ariaLabel: "Heading 1", prefix: "# " },
  { type: "line", label: "H2", icon: <Heading2 className="h-4 w-4" />, ariaLabel: "Heading 2", prefix: "## " },
  { type: "line", label: "•", icon: <List className="h-4 w-4" />, ariaLabel: "Bullet List", prefix: "- " },
  { type: "line", label: "1.", icon: <ListOrdered className="h-4 w-4" />, ariaLabel: "Numbered List", prefix: "1. " },
  { type: "wrap", label: "<>", icon: <Code className="h-4 w-4" />, ariaLabel: "Inline Code", prefix: "`", suffix: "`", placeholder: "code" },
  { type: "wrap", label: "🔗", icon: <Link className="h-4 w-4" />, ariaLabel: "Link", prefix: "[", suffix: "](url)", placeholder: "link text" },
  { type: "line", label: ">", icon: <Quote className="h-4 w-4" />, ariaLabel: "Blockquote", prefix: "> " },
];

export function MarkdownToolbar({ textareaRef, onChange, visible = true }: MarkdownToolbarProps) {
  const applyFormat = (format: FormatConfig) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { value, selectionStart: start, selectionEnd: end } = textarea;
    const selected = value.substring(start, end);

    let newValue: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (format.type === "wrap") {
      const { prefix, suffix, placeholder } = format;
      const insertText = selected || placeholder;
      newValue = value.substring(0, start) + prefix + insertText + suffix + value.substring(end);
      newCursorStart = start + prefix.length;
      newCursorEnd = start + prefix.length + insertText.length;
    } else {
      // Line prefix: find the start of the current line
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const { prefix } = format;
      // Check if prefix already exists at line start
      const lineContent = value.substring(lineStart);
      if (lineContent.startsWith(prefix)) {
        // Remove prefix (toggle off)
        newValue = value.substring(0, lineStart) + value.substring(lineStart + prefix.length);
        newCursorStart = Math.max(lineStart, start - prefix.length);
        newCursorEnd = Math.max(lineStart, end - prefix.length);
      } else {
        newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
        newCursorStart = start + prefix.length;
        newCursorEnd = end + prefix.length;
      }
    }

    onChange(newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    });
  };

  return (
    <div
      className={cn(
        "markdown-toolbar",
        visible ? "markdown-toolbar-visible" : "markdown-toolbar-hidden"
      )}
    >
      {formats.map((format) => (
        <button
          key={format.ariaLabel}
          type="button"
          aria-label={format.ariaLabel}
          title={format.ariaLabel}
          className="markdown-toolbar-btn"
          onMouseDown={(e) => {
            // Prevent blur on textarea
            e.preventDefault();
            applyFormat(format);
          }}
        >
          {format.icon}
        </button>
      ))}
    </div>
  );
}
