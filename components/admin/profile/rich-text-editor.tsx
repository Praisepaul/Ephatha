"use client";

import * as React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Palette,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { richTextToPlainText, sanitizeRichText } from "@/lib/cms/rich-text";

type RichTextEditorProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
};

type Command =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "removeFormat"
  | "undo"
  | "redo"
  | "foreColor";

function ToolbarButton({ label, icon: Icon, onClick }: { label: string; icon: typeof Bold; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" onMouseDown={(event) => event.preventDefault()} onClick={onClick} aria-label={label} title={label}>
      <Icon className="size-4" aria-hidden="true" />
    </Button>
  );
}

export function RichTextEditor({ id, label, placeholder, value, onChange, maxLength = 5000 }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const lastValueRef = React.useRef(value);
  const characterCount = richTextToPlainText(value).length;

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor || lastValueRef.current === value || editor.innerHTML === value) return;
    editor.innerHTML = value;
    lastValueRef.current = value;
  }, [value]);

  function focusEditor() {
    editorRef.current?.focus();
  }

  function handleInput() {
    const editor = editorRef.current;
    if (!editor) return;
    const sanitized = sanitizeRichText(editor.innerHTML);
    const plainText = richTextToPlainText(sanitized);
    if (plainText.length > maxLength) {
      editor.innerHTML = lastValueRef.current;
      return;
    }
    if (editor.innerHTML !== sanitized) editor.innerHTML = sanitized;
    lastValueRef.current = sanitized;
    onChange(sanitized);
  }

  function runCommand(command: Command, commandValue?: string) {
    focusEditor();
    document.execCommand(command, false, commandValue);
    handleInput();
  }

  function formatHeading(value: string) {
    focusEditor();
    document.execCommand("formatBlock", false, value);
    handleInput();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="overflow-hidden rounded-xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring/40">
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1" role="toolbar" aria-label={`${label} formatting`}>
          <select aria-label="Text style" defaultValue="p" className="h-9 rounded-md border bg-background px-2 text-sm" onChange={(event) => formatHeading(event.target.value)}>
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>
          <ToolbarButton label="Bold" icon={Bold} onClick={() => runCommand("bold")} />
          <ToolbarButton label="Italic" icon={Italic} onClick={() => runCommand("italic")} />
          <ToolbarButton label="Underline" icon={Underline} onClick={() => runCommand("underline")} />
          <ToolbarButton label="Strikethrough" icon={Strikethrough} onClick={() => runCommand("strikeThrough")} />
          <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Bulleted list" icon={List} onClick={() => runCommand("insertUnorderedList")} />
          <ToolbarButton label="Numbered list" icon={ListOrdered} onClick={() => runCommand("insertOrderedList")} />
          <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Align left" icon={AlignLeft} onClick={() => runCommand("justifyLeft")} />
          <ToolbarButton label="Align center" icon={AlignCenter} onClick={() => runCommand("justifyCenter")} />
          <ToolbarButton label="Align right" icon={AlignRight} onClick={() => runCommand("justifyRight")} />
          <span className="relative mx-0.5 inline-flex size-9 items-center justify-center rounded-md hover:bg-muted" title="Text color">
            <Palette className="size-4" aria-hidden="true" />
            <input type="color" aria-label="Text color" defaultValue="#0f766e" onChange={(event) => runCommand("foreColor", event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
          </span>
          <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Undo" icon={Undo2} onClick={() => runCommand("undo")} />
          <ToolbarButton label="Redo" icon={Redo2} onClick={() => runCommand("redo")} />
          <ToolbarButton label="Remove formatting" icon={RemoveFormatting} onClick={() => runCommand("removeFormat")} />
        </div>
        <div
          ref={editorRef}
          id={id}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          data-placeholder={placeholder}
          onInput={handleInput}
          onPaste={handlePaste}
          onBlur={handleInput}
          className="min-h-36 max-h-[28rem] overflow-y-auto px-4 py-3 text-sm leading-7 outline-none sm:text-base [&:empty]:before:pointer-events-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mb-1 [&_h4]:text-lg [&_h4]:font-semibold [&_li]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-1 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:space-y-1"
        />
      </div>
      <p className="text-xs text-muted-foreground">Optional · {characterCount.toLocaleString()}/{maxLength} characters · Rich formatting is supported.</p>
    </div>
  );
}
