export function generateSlug(name: string): string {
  return name
    // Decode common HTML entities before stripping — &#038; would otherwise leave "038" digits
    .replace(/&#038;/g, ' ')      // & (ampersand used as "and")
    .replace(/&amp;/g, ' ')       // &amp;
    .replace(/&#8211;/g, '-')     // – em dash
    .replace(/&#8220;|&#8221;/g, '') // curly quotes
    .replace(/&#\d+;/g, ' ')     // any remaining numeric entities
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Truncate meta-description copy at the last full word within maxLength, so
// SERP snippets never end mid-word (e.g. "...and m") — appends "…" only when
// actually cut short.
export function truncateDescription(text: string, maxLength: number = 155): string {
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

// Strip trailing size/quantity suffixes so "ipamorelin-10mg" normalises to "ipamorelin"
export function stripSizeSuffix(slug: string): string {
  return slug
    .replace(/-8211-\d+(\.\d+)?(mg|mcg|g|iu|ml)$/, '')              // HTML em-dash entity + size
    .replace(/-8211$/, '')                                           // bare HTML em-dash entity
    .replace(/-\d+(\.\d+)?(mg|mcg|g|iu|ml)-\d+-vials?(kit)?$/, '')  // -10mg-10-vials
    .replace(/-\d+-vials?(kit)?$/, '')                               // -10-vials
    .replace(/-\d+(\.\d+)?(mg|mcg|g|iu|ml)-\d+(\.\d+)?(mg|mcg|g|iu|ml)$/, '') // -5mg-10mg (size range)
    .replace(/-\d+(\.\d+)?-(mg|mcg|g|iu|ml)$/, '')                  // -10-mg (hyphenated unit)
    .replace(/-\d+(\.\d+)?(mg|mcg|g|iu|ml)$/, '')                   // -10mg, -500mcg
    .replace(/-\d+(x\d+)?(ct|caps?|tabs?|tablets?)$/, '')            // -30-caps
    // Known compound-name suffixes vendors append to the primary compound name
    .replace(/-thymosin-beta-4$/, '')     // "TB-500 (Thymosin Beta-4)" → tb-500
    .replace(/-mod-grf-1-29$/, '')        // "CJC-1295 No DAC (Mod GRF 1-29)" → cjc-1295-no-dac
    .replace(/-peptide$/, '')                                        // -peptide suffix
    .replace(/^receptor-grade-/, '')                                 // quality grade prefix
}
