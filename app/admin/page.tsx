import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return redirect('/404')

  return <AdminClient />
}
