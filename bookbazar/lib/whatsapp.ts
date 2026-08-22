/**
 * Builds a free "click to chat" WhatsApp link — no API key, no account,
 * no cost. It only opens a prefilled chat when someone taps it; it can't
 * push a message on its own.
 */
export function buildWhatsAppLink(rawPhone: string | null | undefined, message: string): string | null {
  if (!rawPhone) return null

  const digits = rawPhone.replace(/\D/g, "")
  if (!digits) return null

  const withCountryCode = digits.startsWith("977") ? digits : `977${digits.replace(/^0+/, "")}`

  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`
}
