
import React, { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

interface User {
    userId: string
    name: string
    role: string
    tenantId: string
    ensaioRegionalId?: string
    ensaioRegionalNome?: string
    ensaioRegionalInicio?: string
    ensaioRegionalFim?: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (token: string) => void
    logout: () => void
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({} as any)

// Axios instance
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true // Important for cookies
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const login = (newToken: string) => {
        setToken(newToken)
        try {
            const decoded: any = jwtDecode(newToken)
            setUser({
                userId: decoded.userId,
                name: decoded.name || 'Usuário',
                role: decoded.role,
                tenantId: decoded.tenantId,
                regionalId: decoded.regionalId,
                ensaioRegionalId: decoded.ensaioRegionalId,
                ensaioRegionalNome: decoded.ensaioRegionalNome,
                ensaioRegionalInicio: decoded.ensaioRegionalInicio,
                ensaioRegionalFim: decoded.ensaioRegionalFim,
            })
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        } catch (e) {
            console.error("Invalid token", e)
        }
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        delete api.defaults.headers.common['Authorization']
        // Call backend logout to clear cookie
        api.post('/auth/logout').catch(() => { })
    }

    // Interceptor for Refresh Token
    useEffect(() => {
        let isRefreshing = false
        let failedQueue: any[] = []

        const processQueue = (error: any, token: string | null = null) => {
            failedQueue.forEach(prom => {
                if (error) {
                    prom.reject(error)
                } else {
                    prom.resolve(token)
                }
            })
            failedQueue = []
        }

        const interceptor = api.interceptors.response.use(
            response => response,
            async error => {
                const originalRequest = error.config

                // If error is not 401 or request is already a retry or is a login/refresh request, reject
                if (error.response?.status !== 401 || originalRequest._retry) {
                    return Promise.reject(error)
                }

                if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
                    return Promise.reject(error)
                }

                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    }).then(token => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token
                        return api(originalRequest)
                    }).catch(err => {
                        return Promise.reject(err)
                    })
                }

                originalRequest._retry = true
                isRefreshing = true

                return new Promise((resolve, reject) => {
                    api.post('/auth/refresh')
                        .then(({ data }) => {
                            const newToken = data.accessToken
                            login(newToken)
                            originalRequest.headers['Authorization'] = 'Bearer ' + newToken
                            processQueue(null, newToken)
                            resolve(api(originalRequest))
                        })
                        .catch((err) => {
                            processQueue(err, null)
                            logout()
                            window.location.href = '/login'
                            reject(err)
                        })
                        .finally(() => {
                            isRefreshing = false
                        })
                })
            }
        )

        // Initial Load (Try refresh to get session if exists)
        const initAuth = async () => {
            try {
                // If we get 401 here, the interceptor above will NOT retry because it's a refresh URL
                const { data } = await api.post('/auth/refresh')
                login(data.accessToken)
            } catch (e) {
                // Not logged in or expired
            } finally {
                setLoading(false)
            }
        }

        initAuth()

        return () => {
            api.interceptors.response.eject(interceptor)
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
