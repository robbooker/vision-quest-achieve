import React from "react";
import { cn } from "@/lib/utils";
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, Link, Quote, Maximize2 } from "lucide-react";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  visible?: boolean;
  onExpand?: () => void;
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

export function MarkdownToolbar({ textareaRef, onChange, visible = true, onExpand }: MarkdownToolbarProps) {
  const applyFormat = (format: FormatConfig) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.substring(start, end);

    let newValue: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (format.type === "wrap") {
      const text = selected || format.placeholder;
      newValue =
        value.substring(0, start) +
        format.prefix +
        text +
        format.suffix +
        value.substring(end);
      newCursorStart = start + format.prefix.length;
      newCursorEnd = newCursorStart + text.length;
    } else {
      // Line prefix: find the start of the current line
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const beforeLine = value.substring(0, lineStart);
      const afterCursor = value.substring(lineStart);

      // If multiple lines are selected, prefix each line
      const lines = value.substring(lineStart, end || value.indexOf("\n", start)).split("\n");
      if (selected && selected.includes("\n")) {
        const selectedLines = selected.split("\n");
        const prefixed = selectedLines.map((line, i) => {
          const prefix = format.prefix === "1. " ? `${i + 1}. ` : format.prefix;
          return prefix + line;
        }).join("\n");
        newValue = value.substring(0, start) + prefixed + value.substring(end);
        newCursorStart = start;
        newCursorEnd = start + prefixed.length;
      } else {
        newValue = beforeLine + format.prefix + afterCursor;
        newCursorStart = start + format.prefix.length;
        newCursorEnd = newCursorStart;
      }
    }

    onChange(newValue);

    // Restore cursor position after React re-render
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
      {onExpand && (
        <>
          <div className="flex-1" />
          <button
            type="button"
            aria-label="Fullscreen"
            title="Fullscreen"
            className="markdown-toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              onExpand();
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
