import { getCreditSettings } from "@/lib/credits"

// Public — just the two numbers marketing copy needs (reward size, rupee
// value). Nothing sensitive; no auth required.
export async function GET() {
  const settings = await getCreditSettings()
  return Response.json(
    { contributionReward: settings.contributionReward, creditValueInRupees: settings.creditValueInRupees },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
  )
}
