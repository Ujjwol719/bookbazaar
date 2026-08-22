export function baseEmailHtml({
  title,
  greeting,
  body,
  ctaLabel,
  ctaUrl,
  footer,
}: {
  title: string
  greeting: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  footer?: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin-bottom: 16px;">${title}</h2>
      <p style="font-size: 16px; line-height: 1.7;">${greeting}</p>
      <div style="font-size: 16px; line-height: 1.7;">${body}</div>
      ${ctaLabel && ctaUrl ? `<a href="${ctaUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:20px 0;">${ctaLabel}</a>` : ''}
      ${footer ? `<p style="color:#64748b;font-size:14px;line-height:1.6;">${footer}</p>` : ''}
    </div>
  `
}
