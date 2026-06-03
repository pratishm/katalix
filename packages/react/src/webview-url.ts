/** Allow only http(s) URLs in web iframes. */
export const isAllowedWebViewUrl = (source: string): boolean => {
  try {
    const url = new URL(source);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
