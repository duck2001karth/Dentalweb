import sanitizeHtml from "sanitize-html"

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

  return sanitizeHtml(dirtyHtml, {
    allowedTags: [
      "b", "i", "u", "strong", "em", "p", "br", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "span", "div", "table", "thead", "tbody",
      "tr", "th", "td",
    ],
    allowedAttributes: {
      "*": ["class", "style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/i],
        "color": [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
        "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
        "font-weight": [/^(normal|bold|[1-9]00)$/i],
        "font-style": [/^(normal|italic)$/i],
        "text-decoration": [/^(none|underline|line-through)$/i],
        "font-size": [/^\d+(\.\d+)?(px|rem|em|%)$/i],
      },
    },
    disallowedTagsMode: "discard",
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
    parser: { lowerCaseTags: true },
  })
}

/** Política existente para URL de medios; sin cambios de compatibilidad. */
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
