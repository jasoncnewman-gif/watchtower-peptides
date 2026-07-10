export interface CoverProduct {
  id: string
  name: string
  priceCents: number
  productType: 'panel' | 'ala-carte'
  biomarkerIds: string[]
}

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
 * Greedy weighted set cover: repeatedly picks the product with the lowest
 * price-per-newly-covered-marker until either every target marker is covered
 * or no remaining product covers any uncovered marker.
 */
export function greedySetCover(targetBiomarkerIds: string[], products: CoverProduct[]): SetCoverResult {
  const remaining = new Set(targetBiomarkerIds)
  const selected: CoverSelection[] = []
  let totalCents = 0
  const candidates = [...products]

  while (remaining.size > 0) {
    let best: { product: CoverProduct; newMarkers: string[]; costPerMarker: number } | null = null

    for (const product of candidates) {
      const newMarkers = product.biomarkerIds.filter((id) => remaining.has(id))
      if (newMarkers.length === 0) continue
      const costPerMarker = product.priceCents / newMarkers.length
      if (
        !best ||
        costPerMarker < best.costPerMarker ||
        (costPerMarker === best.costPerMarker && newMarkers.length > best.newMarkers.length)
      ) {
        best = { product, newMarkers, costPerMarker }
      }
    }

    if (!best) break // nothing left covers any remaining marker

    selected.push({ product: best.product, newMarkersCovered: best.newMarkers })
    totalCents += best.product.priceCents
    for (const id of best.newMarkers) remaining.delete(id)
    candidates.splice(candidates.indexOf(best.product), 1)
  }

  return {
    selected,
    totalCents,
    coveredBiomarkerIds: targetBiomarkerIds.filter((id) => !remaining.has(id)),
    missingBiomarkerIds: [...remaining],
  }
}
