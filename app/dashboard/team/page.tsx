'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardShell from '@/components/DashboardShell'

interface TeamMember {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string | null
  isPending?: boolean
}

export default function TeamPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('USER')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/team/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      if (response.ok) {
        const data = await response.json()
        setInviteEmail('')
        setInviteLink(data.inviteUrl || null)
        setInviteCopied(false)
        fetchMembers()
      }
    } catch (error) {
      console.error('Error inviting member:', error)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/team/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (response.ok) fetchMembers()
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    try {
      const response = await fetch(`/api/team/members?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) fetchMembers()
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const isOwner = session?.user?.role === 'OWNER'

  return (
    <DashboardShell title="Team">
      {/* Invite card */}
      <div className="db-shell-card">
        <div className="db-shell-card-title">Invite New Member</div>
        <form onSubmit={handleInvite} className="db-shell-form">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address"
            className="db-shell-input"
            required
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="db-shell-select"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            {isOwner && <option value="OWNER">Owner</option>}
          </select>
          <button type="submit" className="db-shell-btn">
            Invite
          </button>
        </form>
        {inviteLink && (
          <div className="db-invite-link-row">
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>Invite link ready</span>
            <span className="db-invite-link-url">{inviteLink}</span>
            <button
              type="button"
              className="db-invite-copy-btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteLink)
                  setInviteCopied(true)
                } catch {
                  setInviteCopied(false)
                }
              }}
            >
              {inviteCopied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        )}
      </div>

      {/* Members table */}
      <div className="db-shell-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="db-shell-card-title" style={{ marginBottom: 0 }}>Team Members</div>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
            Loading...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="db-shell-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.email}</td>
                    <td style={{ color: 'var(--t2)' }}>
                      {member.isPending ? (
                        <span className="db-role-badge">Pending</span>
                      ) : (
                        member.name || '—'
                      )}
                    </td>
                    <td>
                      {isOwner && !member.isPending && member.id !== session?.user?.id ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="db-shell-role-select"
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                          <option value="OWNER">Owner</option>
                        </select>
                      ) : (
                        <span className="db-role-badge">{member.role}</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--t3)', fontSize: 12 }}>
                      {member.isPending || !member.createdAt
                        ? '—'
                        : new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {isOwner && member.id !== session?.user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="db-shell-btn-ghost"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
