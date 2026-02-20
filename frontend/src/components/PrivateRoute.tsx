
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function PrivateRoute({ children, role }: { children: React.ReactNode, role?: string }) {
    const { user, loading } = useAuth()

    if (loading) return <div>Carregando...</div>

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (role && user.role !== role) {
        // Allow SUPERADMIN and ADMIN_REGIONAL to access ADMIN routes
        if (role === 'ADMIN' && (user.role === 'SUPERADMIN' || user.role === 'ADMIN_REGIONAL')) {
            return <>{children}</>
        }
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
