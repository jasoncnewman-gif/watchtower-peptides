/**
 * Shared Puppeteer auth helper.
 * Tries login first; if that fails, auto-registers using the same credentials.
 * Handles WooCommerce, cptrg (Certified Pep's embedded gate), and generic forms.
 */

import type { Page } from 'puppeteer'

export interface AuthConfig {
  email:    string
  password: string
  username?: string | null
  phone?:   string | null
  /** Optional URL to navigate to first (defaults to /my-account/) */
  loginPath?: string | null
}

type AuthResult = 'logged_in' | 'registered' | 'failed'

/** JS-safe value setter — works on hidden or off-screen inputs. */
async function setField(page: Page, selector: string, value: string) {
  await page.evaluate((sel: string, val: string) => {
    const el = document.querySelector(sel) as HTMLInputElement | null
    if (!el) return
    el.value = val
    el.dispatchEvent(new Event('input',  { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, selector, value)
}

/** JS-safe click — works on off-screen elements. */
async function jsClick(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel: string) => {
    const el = document.querySelector(sel) as HTMLElement | null
    if (!el) return false
    el.click()
    return true
  }, selector)
}

/**
 * Log in or register on a vendor site.
 * Returns the result status.
 */
export async function loginOrRegister(page: Page, cfg: AuthConfig): Promise<AuthResult> {
  const loginValue = cfg.username ?? cfg.email

  // ── 1. Try cptrg embedded form (Certified Pep style — form is in the COA page itself)
  const hasCptrg = await page.$('input[name="user_login"]') !== null
  if (hasCptrg) {
    await setField(page, 'input[name="user_login"]', loginValue)
    await setField(page, 'input[name="user_pass"]',  cfg.password)
    await page.evaluate(() => {
      const cb = document.querySelector('input[name="cptrg_consent"]') as HTMLInputElement
      if (cb && !cb.checked) cb.click()
    })
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
      jsClick(page, '.cptrg-panel.is-active .cptrg-btn[type="submit"]'),
    ])
    await new Promise(r => setTimeout(r, 2000))
    const text = await page.evaluate(() => document.body.innerText)
    if (!/sign.?in|email or username/i.test(text)) return 'logged_in'
  }

  // ── 2. Standard WooCommerce login form (#username / #password)
  const hasWoo = await page.$('#username') !== null
  if (hasWoo) {
    await page.evaluate((u: string, p: string) => {
      const uf = document.querySelector('#username') as HTMLInputElement
      const pf = document.querySelector('#password') as HTMLInputElement
      if (uf) { uf.value = u; uf.dispatchEvent(new Event('input', { bubbles: true })) }
      if (pf) { pf.value = p; pf.dispatchEvent(new Event('input', { bubbles: true })) }
      const btn = document.querySelector('button[name="login"]') as HTMLButtonElement
        || document.querySelector('.woocommerce-form-login button[type="submit"]') as HTMLButtonElement
        || document.querySelector('form.login button[type="submit"]') as HTMLButtonElement
      if (btn) btn.click()
    }, loginValue, cfg.password)
    await new Promise(r => setTimeout(r, 5000))

    const text = await page.evaluate(() => document.body.innerText)
    const bad  = /unknown email|incorrect|invalid|error/i.test(text)
    const good = /log.?out|hello|dashboard|my account/i.test(text)
    if (good && !bad) return 'logged_in'
    // If login failed due to unknown account → fall through to registration
    if (!bad) return 'failed'
  }

  // ── 3. Auto-register (WooCommerce registration form)
  const regEmail = await page.$('#reg_email, #reg_billing_email, input[name="email"][id*="reg"]') !== null
  if (regEmail) {
    // Set registration fields by ID where available
    const fields: [string, string][] = [
      ['#reg_billing_first_name, #reg_first_name',  'Watchtower'],
      ['#reg_billing_last_name, #reg_last_name',    'Research'],
      ['#reg_email, #reg_billing_email',             cfg.email],
      ['#reg_password',                              cfg.password],
      ['#reg_billing_phone, #reg_phone, input[name*="phone"]', cfg.phone ?? ''],
    ]

    for (const [sel, val] of fields) {
      // Try each comma-separated selector
      for (const s of sel.split(', ')) {
        const exists = await page.$(s) !== null
        if (exists) { await setField(page, s, val); break }
      }
    }

    // Tick any required checkboxes (terms, age, research use)
    await page.evaluate(() => {
      document.querySelectorAll('input[type="checkbox"][required], input[name*="terms"], input[name*="consent"], input[name*="pp_terms"]')
        .forEach(cb => { (cb as HTMLInputElement).checked = true })
    })

    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
      page.evaluate(() => {
        const regForm = document.getElementById('reg_email')?.closest('form')
          || document.querySelector('form.register, form.woocommerce-form-register')
        const btn = regForm?.querySelector('button[type="submit"]') as HTMLButtonElement
          || document.querySelector('button[name="register"]') as HTMLButtonElement
        if (btn) btn.click()
      }),
    ])
    await new Promise(r => setTimeout(r, 3000))

    const text = await page.evaluate(() => document.body.innerText).catch(() => '')
    if (/log.?out|hello|dashboard|my account/i.test(text)) return 'registered'
    if (/already registered|email.*exist/i.test(text)) {
      // Account exists — retry login
      return loginOrRegister(page, cfg)
    }
  }

  return 'failed'
}

/**
 * Fetches vendor credentials from Supabase.
 * Returns null if the vendor has no stored login.
 */
export async function getVendorAuth(vendorSlug: string, db: any): Promise<AuthConfig | null> {
  const { data } = await db
    .from('vendors')
    .select('login_email, login_password, login_username, login_phone, login_path')
    .eq('slug', vendorSlug)
    .single()

  if (!data?.login_email || !data?.login_password) return null
  return {
    email:     data.login_email,
    password:  data.login_password,
    username:  data.login_username ?? undefined,
    phone:     data.login_phone ?? undefined,
    loginPath: data.login_path ?? undefined,
  }
}
