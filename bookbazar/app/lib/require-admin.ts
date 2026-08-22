import 'server-only'
import { cookies } from 'next/headers'
import { decrypt } from '@/app/lib/session'

// Shared by every Academic Management route — one place enforcing
// "only ADMIN" instead of the same three lines re-implemented per file.
export async function requireAdmin() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value

  if (!sessionCookie) {
    return { error: Response.json({ message: 'Unauthorized' }, { status: 401 }) }
  }

  const payload = await decrypt(sessionCookie)

  if (!payload || payload.role !== 'ADMIN') {
    return { error: Response.json({ message: 'Admin access only' }, { status: 403 }) }
  }

  return { payload }
}
