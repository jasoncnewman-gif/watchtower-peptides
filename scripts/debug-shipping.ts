import { db } from "./lib/client.js"

async function main() {
  const { data } = await db
    .from("vendors")
    .select("name, shipping_free_threshold, shipping_flat_fee, ships_internationally, credit_card_accepted, crypto_accepted, paypal_accepted")
    .eq("status", "active")
    .order("name")

  for (const v of data ?? []) {
    const parts = []
    if (v.shipping_free_threshold === 0) parts.push("Free ship (all)")
    else if (v.shipping_free_threshold != null) parts.push(`Free ship $${v.shipping_free_threshold}+`)
    if (v.shipping_flat_fee != null) parts.push(`Flat $${v.shipping_flat_fee}`)
    if (v.ships_internationally)   parts.push("Intl")
    if (v.credit_card_accepted)    parts.push("CC")
    if (v.crypto_accepted)         parts.push("Crypto")
    if (v.paypal_accepted)         parts.push("PayPal")
    console.log(`${v.name.padEnd(32)} ${parts.join(" | ") || "(no data)"}`)
  }
}

main()
