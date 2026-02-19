
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Default Tenant',
        },
    })

    const passwordHash = await bcrypt.hash('123456', 6)

    const admin = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            name: 'Admin User',
            email: 'admin@test.com',
            passwordHash,
            role: 'ADMIN',
        },
    })

    const user = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            name: 'Regular User',
            email: 'user@test.com',
            passwordHash,
            role: 'USER',
        },
    })

    console.log('Seed successful')
    console.log('Tenant:', tenant.id)
    console.log('Admin:', admin.email)
    console.log('User:', user.email, 'ID:', user.id)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
