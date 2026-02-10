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
    // ... keep existing code
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
