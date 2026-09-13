const ALLOWED_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "br",
  "span",
]);

function sanitizeStyle(value: string): string {
  const declarations = value.split(";").map((item) => item.trim()).filter(Boolean);
  const safe: string[] = [];

  for (const declaration of declarations) {
    const separator = declaration.indexOf(":");
    if (separator < 0) continue;
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const propertyValue = declaration.slice(separator + 1).trim();

    if (property === "color" && /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\)|hsl\([^)]{1,40}\))$/i.test(propertyValue)) {
      safe.push(`color: ${propertyValue}`);
    }

    if (property === "text-align" && /^(left|center|right|justify)$/i.test(propertyValue)) {
      safe.push(`text-align: ${propertyValue.toLowerCase()}`);
    }
  }

  return safe.join("; ");
}

function sanitizeTag(tag: string): string {
  const match = tag.match(/^<\s*(\/?)\s*([a-z0-9]+)([^>]*)>$/i);
  if (!match) return "";
  const closing = Boolean(match[1]);
  const name = match[2].toLowerCase();
  if (!ALLOWED_TAGS.has(name)) return "";
  if (closing || name === "br") return `</${name}>`.replace("</br>", "<br>");

  const attributes = match[3] ?? "";
  const output: string[] = [];
  const attributePattern = /([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let attributeMatch: RegExpExecArray | null;

  while ((attributeMatch = attributePattern.exec(attributes)) !== null) {
    const attribute = attributeMatch[1].toLowerCase();
    const value = attributeMatch[2] ?? attributeMatch[3] ?? attributeMatch[4] ?? "";

    if (attribute === "style") {
      const style = sanitizeStyle(value);
      if (style) output.push(`style="${style.replace(/"/g, "&quot;")}"`);
      continue;
    }

    if (attribute === "href" && name === "a") {
      try {
        const url = new URL(value, "https://ephatha.local");
        const isRelative = value.startsWith("/") && !value.startsWith("//");
        if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol) && !isRelative) continue;
        output.push(`href="${value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`);
      } catch {
        continue;
      }
      continue;
    }

    if (attribute === "target" && name === "a" && value === "_blank") {
      output.push('target="_blank"');
      continue;
    }

    if (attribute === "rel" && name === "a") {
      output.push('rel="noreferrer noopener"');
    }
  }

  return output.length ? `<${name} ${output.join(" ")}>` : `<${name}>`;
}

export function sanitizeRichText(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|svg|math)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, (tag) => sanitizeTag(tag));
}

export function richTextToPlainText(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>|<\/h[1-6]>|<\/li>|<\/blockquote>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeRichText(value: string): string {
  const sanitized = sanitizeRichText(value ?? "");
  return richTextToPlainText(sanitized) ? sanitized : "";
}
