import { richTextToPlainText, sanitizeRichText } from "@/lib/cms/rich-text";

export function RichTextContent({ value, className = "" }: { value: string; className?: string }) {
  const sanitized = sanitizeRichText(value);
  if (!richTextToPlainText(sanitized)) return null;

  if (!/<(p|h[1-6]|ul|ol|li|blockquote|br)\b/i.test(sanitized)) {
    return <p className={`whitespace-pre-line ${className}`}>{richTextToPlainText(sanitized)}</p>;
  }

  return (
    <div
      className={`[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_li]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:space-y-2 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
