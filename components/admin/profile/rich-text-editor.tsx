"use client";

import * as React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
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
  | "foreColor"
  | "createLink";

type FormatState = {
  block: "p" | "h2" | "h3" | "h4";
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
};

function getBlockTag(node: Node | null): FormatState["block"] {
  let current = node instanceof Element ? node : node?.parentElement ?? null;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (tag === "h2" || tag === "h3" || tag === "h4") return tag;
    if (tag === "p" || tag === "div") return "p";
    current = current.parentElement;
  }
  return "p";
}

function readFormatState(): FormatState {
  return {
    block: getBlockTag(document.getSelection()?.anchorNode ?? null),
    bold: document.queryCommandState("bold"),
    italic: document.queryCommandState("italic"),
    underline: document.queryCommandState("underline"),
    strikeThrough: document.queryCommandState("strikeThrough"),
  };
}

function ToolbarButton({ label, icon: Icon, active = false, onClick }: { label: string; icon: typeof Bold; active?: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`size-9 shrink-0 ${active ? "bg-accent text-accent-foreground" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
    >
      <Icon className="size-4" aria-hidden="true" />
    </Button>
  );
}

export function RichTextEditor({ id, label, placeholder, value, onChange, maxLength = 5000 }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const savedSelectionRef = React.useRef<Range | null>(null);
  const lastValueRef = React.useRef<string | null>(null);
  const [formatState, setFormatState] = React.useState<FormatState>({ block: "p", bold: false, italic: false, underline: false, strikeThrough: false });
  const characterCount = richTextToPlainText(value).length;

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor || lastValueRef.current === value) return;
    const sanitizedValue = sanitizeRichText(value);
    if (editor.innerHTML !== sanitizedValue) editor.innerHTML = sanitizedValue;
    lastValueRef.current = value;
  }, [value]);

  function saveSelection() {
    const selection = document.getSelection();
    if (!selection?.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return;
    savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    const range = savedSelectionRef.current;
    if (!range) return;
    const selection = document.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function refreshFormatState() {
    if (!editorRef.current) return;
    setFormatState(readFormatState());
  }

  function focusEditor() {
    editorRef.current?.focus();
    restoreSelection();
  }

  function handleInput() {
    const editor = editorRef.current;
    if (!editor) return;
    const sanitized = sanitizeRichText(editor.innerHTML);
    const plainText = richTextToPlainText(sanitized);
    if (plainText.length > maxLength) {
      editor.innerHTML = lastValueRef.current ?? "";
      return;
    }
    if (editor.innerHTML !== sanitized) editor.innerHTML = sanitized;
    lastValueRef.current = sanitized;
    onChange(sanitized);
    requestAnimationFrame(refreshFormatState);
  }

  function runCommand(command: Command, commandValue?: string) {
    saveSelection();
    focusEditor();
    if (command !== "undo" && command !== "redo" && command !== "removeFormat") {
      document.execCommand("styleWithCSS", false, "true");
    }
    document.execCommand(command, false, commandValue);
    handleInput();
    saveSelection();
  }

  function formatHeading(value: FormatState["block"]) {
    saveSelection();
    focusEditor();
    document.execCommand("formatBlock", false, value);
    handleInput();
    saveSelection();
  }

  function insertLink() {
    saveSelection();
    focusEditor();
    const url = window.prompt("Enter a link address");
    if (!url) return;
    const trimmed = url.trim();
    if (!/^(https?:\/\/|mailto:|tel:|\/[^/])/i.test(trimmed)) return;
    document.execCommand("createLink", false, trimmed);
    handleInput();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertParagraph", false);
      handleInput();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      runCommand(event.shiftKey ? "redo" : "undo");
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      runCommand("redo");
    }
  }

  function handleSelectionChange() {
    if (!editorRef.current?.contains(document.getSelection()?.anchorNode ?? null)) return;
    saveSelection();
    refreshFormatState();
  }

  React.useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  });

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="overflow-hidden rounded-xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring/40">
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1" role="toolbar" aria-label={`${label} formatting`}>
          <select aria-label="Text style" value={formatState.block} className="h-9 rounded-md border bg-background px-2 text-sm" onMouseDown={saveSelection} onChange={(event) => formatHeading(event.target.value as FormatState["block"])}>
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>
          <ToolbarButton label="Bold" icon={Bold} active={formatState.bold} onClick={() => runCommand("bold")} />
          <ToolbarButton label="Italic" icon={Italic} active={formatState.italic} onClick={() => runCommand("italic")} />
          <ToolbarButton label="Underline" icon={Underline} active={formatState.underline} onClick={() => runCommand("underline")} />
          <ToolbarButton label="Strikethrough" icon={Strikethrough} active={formatState.strikeThrough} onClick={() => runCommand("strikeThrough")} />
          <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Bulleted list" icon={List} onClick={() => runCommand("insertUnorderedList")} />
          <ToolbarButton label="Numbered list" icon={ListOrdered} onClick={() => runCommand("insertOrderedList")} />
          <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Align left" icon={AlignLeft} onClick={() => runCommand("justifyLeft")} />
          <ToolbarButton label="Align center" icon={AlignCenter} onClick={() => runCommand("justifyCenter")} />
          <ToolbarButton label="Align right" icon={AlignRight} onClick={() => runCommand("justifyRight")} />
          <span className="relative mx-0.5 inline-flex size-9 items-center justify-center rounded-md hover:bg-muted" title="Text color">
            <Palette className="size-4" aria-hidden="true" />
            <input type="color" aria-label="Text color" defaultValue="#0f766e" onMouseDown={saveSelection} onChange={(event) => runCommand("foreColor", event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
          </span>
          <ToolbarButton label="Add link" icon={Link2} onClick={insertLink} />
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
          onKeyDown={handleKeyDown}
          onMouseUp={refreshFormatState}
          onKeyUp={refreshFormatState}
          className="min-h-36 max-h-[28rem] overflow-y-auto px-4 py-3 text-sm leading-7 outline-none sm:text-base [&:empty]:before:pointer-events-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mb-1 [&_h4]:text-lg [&_h4]:font-semibold [&_li]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-1 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:space-y-1"
        />
      </div>
      <p className="text-xs text-muted-foreground">Optional · {characterCount.toLocaleString()}/{maxLength} characters · Rich formatting is supported.</p>
    </div>
  );
}
