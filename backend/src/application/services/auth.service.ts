
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../infra/database/prisma.client'
import crypto from 'node:crypto'

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret'

// 15 minutes
const ACCESS_TOKEN_EXPIRES_IN = '15m'
// 7 days
const REFRESH_TOKEN_EXPIRES_IN = '7d'

/** Retorna IDs das regionais do usuário: user_regionais ou fallback users.regionalId (retrocompat). */
function getRegionalIdsForToken(user: { regionalId?: string | null; userRegionais?: { regionalId: string }[] }): string[] {
    const fromPivot = user.userRegionais?.map((ur) => ur.regionalId).filter(Boolean) ?? []
    if (fromPivot.length > 0) return fromPivot
    if (user.regionalId) return [user.regionalId]
    return []
}

export class AuthService {
    async login(email: string, password: string) {
        const user = await prisma.user.findFirst({
            where: { email },
            include: {
                ensaioRegional: { select: { nome: true, dataHoraInicio: true, dataHoraFim: true } },
                userRegionais: { select: { regionalId: true } }
            }
        })

        if (!user) {
            throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

        if (!isPasswordValid) {
            throw new Error('Invalid credentials')
        }

        // 1. Check if user has access liberated (Must be linked to an event)
        // Admin bypass for safety
        if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_REGIONAL' && user.role !== 'ADMIN') {
            if (!user.acessoLiberado) {
                const error = new Error('Usuário não convocado para evento ativo.')
                    ; (error as any).statusCode = 403
                throw error
            }

            // 2. Check if event is still active (not passed dataHoraFim)
            if (user.ensaioRegional && new Date() > user.ensaioRegional.dataHoraFim) {
                const error = new Error('Acesso expirado. Este evento já foi encerrado.')
                    ; (error as any).statusCode = 403
                throw error
            }
        }

        const regionalIds = getRegionalIdsForToken(user)
        const accessToken = jwt.sign(
            {
                userId: user.id,
                tenantId: user.tenantId,
                role: user.role,
                regionalId: user.regionalId ?? (regionalIds[0] || null),
                regionalIds: regionalIds.length > 0 ? regionalIds : undefined,
                ensaioRegionalId: user.ensaioRegionalId,
                ensaioRegionalNome: user.ensaioRegional?.nome,
                ensaioRegionalInicio: user.ensaioRegional?.dataHoraInicio,
                ensaioRegionalFim: user.ensaioRegional?.dataHoraFim
            },
            JWT_ACCESS_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
        )

        const refreshToken = crypto.randomUUID()
        const refreshTokenHash = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex')

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tenantId: user.tenantId,
                tokenHash: refreshTokenHash,
                expiresAt,
            },
        })

        return {
            accessToken,
            refreshToken,
        }
    }

    async refresh(refreshToken: string) {
        const refreshTokenHash = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex')

        return await prisma.$transaction(async (tx) => {
            const tokenRecord = await tx.refreshToken.findFirst({
                where: { tokenHash: refreshTokenHash },
            })

            if (!tokenRecord) {
                throw new Error('Invalid refresh token')
            }

            if (tokenRecord.revokedAt) {
                throw new Error('Token revoked - Reuse detected')
            }

            if (new Date() > tokenRecord.expiresAt) {
                throw new Error('Token expired')
            }

            // Revoke old token
            await tx.refreshToken.update({
                where: { id: tokenRecord.id },
                data: { revokedAt: new Date() },
            })

            const user = await tx.user.findUnique({
                where: { id: tokenRecord.userId },
                include: {
                    ensaioRegional: { select: { nome: true, dataHoraInicio: true, dataHoraFim: true } },
                    userRegionais: { select: { regionalId: true } }
                }
            })
            if (!user) throw new Error('User not found')

            const regionalIds = getRegionalIdsForToken(user)
            const newAccessToken = jwt.sign(
                {
                    userId: user.id,
                    tenantId: user.tenantId,
                    role: user.role,
                    regionalId: user.regionalId ?? (regionalIds[0] || null),
                    regionalIds: regionalIds.length > 0 ? regionalIds : undefined,
                    ensaioRegionalId: user.ensaioRegionalId,
                    ensaioRegionalNome: user.ensaioRegional?.nome,
                    ensaioRegionalInicio: user.ensaioRegional?.dataHoraInicio,
                    ensaioRegionalFim: user.ensaioRegional?.dataHoraFim
                },
                JWT_ACCESS_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
            )

            const newRefreshToken = crypto.randomUUID()
            const newRefreshTokenHash = crypto
                .createHash('sha256')
                .update(newRefreshToken)
                .digest('hex')

            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 7)

            await tx.refreshToken.create({
                data: {
                    userId: user.id,
                    tenantId: user.tenantId,
                    tokenHash: newRefreshTokenHash,
                    expiresAt,
                },
            })

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            }
        })
    }

    async logout(refreshToken: string) {
        const refreshTokenHash = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex')

        const tokenRecord = await prisma.refreshToken.findFirst({
            where: { tokenHash: refreshTokenHash },
        })

        if (tokenRecord) {
            await prisma.refreshToken.update({
                where: { id: tokenRecord.id },
                data: { revokedAt: new Date() },
            })
        }
    }
}
