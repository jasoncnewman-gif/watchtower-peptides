export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Strip trailing size/quantity suffixes so "ipamorelin-10mg" normalises to "ipamorelin"
export function stripSizeSuffix(slug: string): string {
  return slug
    .replace(/-\d+(\.\d+)?(mg|mcg|g|iu|ml)-\d+-vials?(kit)?$/, '') // -10mg-10-vials
    .replace(/-\d+-vials?(kit)?$/, '')                               // -10-vials
    .replace(/-\d+(\.\d+)?(mg|mcg|g|iu|ml)$/, '')                   // -10mg, -500mcg
    .replace(/-\d+(x\d+)?(ct|caps?|tabs?|tablets?)$/, '')            // -30-caps
}
