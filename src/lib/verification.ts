/**
 * Site-ownership codes from «Налаштування». The editor may paste, one per line:
 * a whole <meta … content="CODE" /> tag, "google-site-verification=CODE" (DNS form) or just CODE.
 * Returns clean codes (letters, digits, - and _ only), or undefined when there are none.
 */
export function verificationCodes(raw?: string | null): string[] | undefined {
  if (!raw) return undefined
  const codes = raw
    .split(/[\n,]+/)
    .map((line) => {
      const tag = line.match(/content\s*=\s*["']([^"']+)["']/i)
      if (tag) return tag[1].trim()
      if (line.includes('=')) return (line.split('=').pop() || '').trim()
      return line.trim()
    })
    .filter((v) => /^[A-Za-z0-9_-]{8,128}$/.test(v))
  return codes.length ? [...new Set(codes)] : undefined
}
