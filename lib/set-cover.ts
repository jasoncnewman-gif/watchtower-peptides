export interface CoverProduct {
  id: string
  name: string
  priceCents: number
  productType: 'panel' | 'ala-carte'
  biomarkerIds: string[]
  /** Every raw marker name this product reports, including ones we don't track as canonical biomarkers. */
  rawMarkerNames: string[]
}

export type SetCoverMode = 'targeted' | 'value'

export interface CoverSelection {
  product: CoverProduct
  newMarkersCovered: string[]
}

export interface SetCoverResult {
  selected: CoverSelection[]
  totalCents: number
  coveredBiomarkerIds: string[]
  missingBiomarkerIds: string[]
}

/**
 * Greedy weighted set cover: repeatedly picks the best product until either
 * every target marker is covered or no remaining product covers any uncovered
 * marker. A product is only ever a candidate if it covers at least one
 * currently-uncovered target marker -- neither mode pulls in an unrelated
 * panel just because it looks cheap in isolation.
 *
 * Two cost metrics:
 *   - 'targeted' (default): price / newly-covered TARGET markers. Cheapest way
 *     to hit exactly the requested list; treats everything else a product
 *     includes as irrelevant.
 *   - 'value': price / newly-acquired RAW markers (target or not), tracked
 *     against a running set of every raw marker name already picked up by a
 *     previously-selected product. This credits a panel for its bonus markers
 *     the first time, but stops a second overlapping panel from getting undue
 *     credit for markers you'd already have -- without that dedup, two
 *     broad-but-redundant panels can each look individually cheap and both
 *     get selected, which is worse than either one alone.
 */
export function greedySetCover(
  targetBiomarkerIds: string[],
  products: CoverProduct[],
  mode: SetCoverMode = 'targeted'
): SetCoverResult {
  const remaining = new Set(targetBiomarkerIds)
  const acquiredRawNames = new Set<string>()
  const selected: CoverSelection[] = []
  let totalCents = 0
  const candidates = [...products]

  while (remaining.size > 0) {
    let best: { product: CoverProduct; newMarkers: string[]; newRawCount: number; costPerMarker: number } | null = null

    for (const product of candidates) {
      const newMarkers = product.biomarkerIds.filter((id) => remaining.has(id))
      if (newMarkers.length === 0) continue
      const newRawCount =
        mode === 'value'
          ? Math.max(product.rawMarkerNames.filter((n) => !acquiredRawNames.has(n)).length, newMarkers.length)
          : newMarkers.length
      const costPerMarker = product.priceCents / newRawCount
      if (
        !best ||
        costPerMarker < best.costPerMarker ||
        (costPerMarker === best.costPerMarker && newMarkers.length > best.newMarkers.length)
      ) {
        best = { product, newMarkers, newRawCount, costPerMarker }
      }
    }

    if (!best) break // nothing left covers any remaining marker

    selected.push({ product: best.product, newMarkersCovered: best.newMarkers })
    totalCents += best.product.priceCents
    for (const id of best.newMarkers) remaining.delete(id)
    for (const n of best.product.rawMarkerNames) acquiredRawNames.add(n)
    candidates.splice(candidates.indexOf(best.product), 1)
  }

  return {
    selected,
    totalCents,
    coveredBiomarkerIds: targetBiomarkerIds.filter((id) => !remaining.has(id)),
    missingBiomarkerIds: [...remaining],
  }
}
