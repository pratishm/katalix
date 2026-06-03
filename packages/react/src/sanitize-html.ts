const BLOCKED_TAG_CONTENT =
  /<(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi;
const BLOCKED_SELF_CLOSING = /<\/?(?:link|meta|base|script|iframe|object|embed|form)\b[^>]*\/?>/gi;
const EVENT_ATTR = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL = /\s+(href|src|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi;

/** Strip dangerous markup before rendering rich text as HTML (XSS mitigation). */
export const sanitizeHtml = (html: string): string =>
  html
    .replace(BLOCKED_TAG_CONTENT, "")
    .replace(BLOCKED_SELF_CLOSING, "")
    .replace(EVENT_ATTR, "")
    .replace(JS_URL, "");

/** True when content appears to contain HTML tags. */
export const containsHtmlMarkup = (content: string): boolean => /<[a-z][\s\S]*>/i.test(content);
