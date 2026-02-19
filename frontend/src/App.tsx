
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LoginPage } from './pages/Login'
import { PresencaPage } from './pages/Presenca'
import { PerfilPage } from './pages/Perfil'
import { AdminPage } from './pages/Admin'
import { PrivateRoute } from './components/PrivateRoute'
import { MainLayout } from './components/MainLayout'

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected Routes inside Layout */}
                    <Route path="/presenca" element={
                        <PrivateRoute role="USER">
                            <MainLayout>
                                <PresencaPage />
                            </MainLayout>
                        </PrivateRoute>
                    } />

                    <Route path="/perfil" element={
                        <PrivateRoute role="USER">
                            <MainLayout>
                                <PerfilPage />
                            </MainLayout>
                        </PrivateRoute>
                    } />

                    <Route path="/admin/*" element={
                        <PrivateRoute role="ADMIN">
                            <MainLayout>
                                <AdminPage />
                            </MainLayout>
                        </PrivateRoute>
                    } />

                    {/* Default Route */}
                    <Route path="/" element={<Navigate to="/presenca" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App
