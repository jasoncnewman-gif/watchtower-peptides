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

  // Greedy lock-in cleanup: the loop above only compares *marginal* cost-per-marker
  // at each step, so it can pick a cheaper-but-smaller product before it's clear a
  // bigger product (selected later) would have covered the same ground alone -- e.g.
  // Vitals Vault's Max Plan is a confirmed superset of its Essential Plan, but
  // Essential can still win the first iteration on raw $/marker and get locked in.
  // Remove any selected product whose full marker coverage is already provided by
  // the other selected products combined; this can only reduce total cost and never
  // reduces final coverage, since by definition nothing removed here was uniquely
  // contributing.
  let changed = true
  while (changed && selected.length > 1) {
    changed = false
    for (let i = 0; i < selected.length; i++) {
      const othersCoverage = new Set(
        selected.filter((_, j) => j !== i).flatMap((s) => s.product.biomarkerIds)
      )
      if (selected[i].product.biomarkerIds.every((id) => othersCoverage.has(id))) {
        totalCents -= selected[i].product.priceCents
        selected.splice(i, 1)
        changed = true
        break
      }
    }
  }

  // The per-product "newMarkersCovered" counts above are marginal contributions at
  // the time each product was picked, which go stale once cleanup removes an earlier
  // pick -- a product that showed a small marginal count because an now-removed
  // product had already claimed most targets needs to be credited with everything it
  // actually covers. Recompute in cart order so each target marker is attributed to
  // exactly one product, same "first pick gets it" convention as the greedy loop.
  const finalTargetsCovered = new Set<string>()
  for (const s of selected) {
    s.newMarkersCovered = s.product.biomarkerIds.filter(
      (id) => targetBiomarkerIds.includes(id) && !finalTargetsCovered.has(id)
    )
    for (const id of s.newMarkersCovered) finalTargetsCovered.add(id)
  }

  return {
    selected,
    totalCents,
    coveredBiomarkerIds: targetBiomarkerIds.filter((id) => !remaining.has(id)),
    missingBiomarkerIds: [...remaining],
  }
}
