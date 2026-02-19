
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function PrivateRoute({ children, role }: { children: React.ReactNode, role?: string }) {
    const { user, loading } = useAuth()

    if (loading) return <div>Carregando...</div>

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (role && user.role !== role) {
        // If Admin tries to access User route, maybe allow? 
        // Spec says ADMIN accesses /admin, USER accesses /presenca.
        // Presenca is strictly USER role in backend route? 
        // Backend route: app.addHook('preHandler', roleGuard('USER'))
        // If Admin has role 'ADMIN', roleGuard('USER') might fail if strict equality.
        // RoleGuard in backend checks: if (role !== requiredRole).
        // So Admin cannot access User routes unless we change backend logic.
        // For now, strict check.
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
