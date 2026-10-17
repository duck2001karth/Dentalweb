import DOMPurify from "isomorphic-dompurify"

export const escapeHTML = (str?: string | number | null): string => {
  if (str === null || str === undefined) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export const sanitizeRichHTML = (dirtyHtml?: string | null): string => {
  if (!dirtyHtml) return ""
  
  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      "b", "i", "u", "strong", "em", "p", "br", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "span", "div", "table", "thead", "tbody", "tr", "th", "td"
    ],
    ALLOWED_ATTR: ["class", "style"],
    
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "style", "link", "meta", "base"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "ondrop"],
    
    KEEP_CONTENT: false, 
    
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  }) as string
}

export const sanitizeMediaUrl = (url?: string | null, fallback = ""): string => {
  if (!url || typeof url !== "string") return fallback
  const trimmed = url.trim()

  if (/^(javascript:|vbscript:|data:text\/html)/i.test(trimmed)) {
    return fallback
  }

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(trimmed)
  ) {
    return trimmed
  }
  return fallback
}