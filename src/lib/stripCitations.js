// Drafting models sometimes leave bare numbered citation markers such as
// "[4]" or "[4, 9]" in the copy. There is no matching reference list on the
// page, so they are removed before display.
// Markdown links ("[text](url)") are left untouched by the trailing lookahead.
const CITATION_MARKER = /[ \t]*\[\d+(?:\s*,\s*\d+)*\](?!\()/g;

export function stripCitationMarkers(text) {
  if (!text) return text;
  return String(text).replace(CITATION_MARKER, '');
}