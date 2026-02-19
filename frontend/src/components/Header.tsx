
import { useAuth } from '../context/AuthContext'
import { LogOut, User } from 'lucide-react'

export function Header() {
    const { user, logout } = useAuth()

    if (!user) return null

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            zIndex: 10
        }}>
            <div style={{ fontWeight: 'bold', fontSize: 18, color: '#2563eb' }}>
                Ensaios
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    <User size={16} />
                    <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.role}
                    </span>
                </div>
                <button
                    onClick={logout}
                    style={{ padding: 8, background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0' }}
                    aria-label="Sair"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    )
}
