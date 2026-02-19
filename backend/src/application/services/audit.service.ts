
import { prisma } from '../../infra/database/prisma.client'

export class AuditService {
    static async log(data: {
        tenantId: string
        userId: string
        action: string
        entity: string
        entityId: string
        details?: string
    }) {
        try {
            await prisma.auditLog.create({
                data: {
                    tenantId: data.tenantId,
                    userId: data.userId,
                    action: data.action,
                    entity: data.entity,
                    entityId: data.entityId,
                    details: data.details
                }
            })
        } catch (e) {
            console.error('Failed to create audit log', e)
            // Don't fail the main transaction? 
            // Audit failures should ideally be non-blocking or critical depending on policy.
            // For now, non-blocking (log error).
        }
    }
}
