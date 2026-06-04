import { db } from "./lib/client.js"

async function main() {
  const { data } = await db
    .from("vendors")
    .select("name, shipping_free_threshold, ships_internationally, credit_card_accepted, crypto_accepted, paypal_accepted")
    .eq("status", "active")
    .order("name")

  for (const v of data ?? []) {
    const parts = []
    if (v.shipping_free_threshold) parts.push(`Free ship $${v.shipping_free_threshold}+`)
    if (v.ships_internationally)   parts.push("Intl shipping")
    if (v.credit_card_accepted)    parts.push("CC")
    if (v.crypto_accepted)         parts.push("Crypto")
    if (v.paypal_accepted)         parts.push("PayPal")
    console.log(`${v.name.padEnd(30)} ${parts.join(" | ") || "(no data)"}`)
  }
}

main()
