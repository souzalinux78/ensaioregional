
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── CCB OFFICIAL DATA ────────────────────────────────────────────────────────

const FUNCOES_MINISTERIO = [
    'ANCIÃO',
    'DIÁCONO',
    'COOP. OFÍCIO MINISTERIAL',
    'COOP. JOVENS E MENORES',
    'ENCARREGADO REGIONAL',
    'EXAMINADORA',
    'ENCARREGADO LOCAL',
    'INSTRUTOR',
    'ORGANISTA',
    'MÚSICO',
]

const INSTRUMENTOS = [
    // CORDAS
    'VIOLINO',
    'VIOLA',
    'VIOLONCELO',
    // MADEIRAS
    'FLAUTA',
    'FLAUTA ALTO',
    'FLAUTA BAIXO',
    'OBOÉ',
    "OBOÉ D'AMORE",
    'CORNE INGLÊS',
    'FAGOTE',
    'CONTRA-FAGOTE',
    'CLARINETE',
    'CLARINETE ALTO',
    'CLARINETE CONTRA-ALTO',
    'CLARINETE BAIXO',
    'CLARINETE CONTRA-BAIXO',
    'SAXOFONE SOPRANO',
    'SAXOFONE ALTO',
    'SAXOFONE TENOR',
    'SAXOFONE BARÍTONO',
    'SAXOFONE BAIXO',
    // METAIS
    'TROMPETE',
    'CORNET',
    'POCKET',
    'FLUGEL HORN',
    'TROMPA',
    'TROMBONITO',
    'TROMBONE',
    'BARÍTONO DE PISTO',
    'SAX HORN / GENES',
    'BOMBARDINO / EUPHONIO',
    'TUBA',
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function seedFuncoes(tenantId: string) {
    let created = 0
    let skipped = 0

    for (const nome of FUNCOES_MINISTERIO) {
        try {
            await prisma.funcaoMinisterio.upsert({
                where: { tenantId_nome: { tenantId, nome } },
                update: { deletedAt: null }, // Restore if soft-deleted
                create: { tenantId, nome },
            })
            created++
        } catch {
            skipped++
        }
    }

    console.log(`  ✅ Funções: ${created} upserted, ${skipped} skipped`)
}

async function seedInstrumentos(tenantId: string) {
    let created = 0
    let skipped = 0

    for (const nome of INSTRUMENTOS) {
        try {
            await prisma.instrumento.upsert({
                where: { tenantId_nome: { tenantId, nome } },
                update: { deletedAt: null }, // Restore if soft-deleted
                create: { tenantId, nome },
            })
            created++
        } catch {
            skipped++
        }
    }

    console.log(`  ✅ Instrumentos: ${created} upserted, ${skipped} skipped`)
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱 Starting seed...')

    // 1. Ensure Tenant DEFAULT exists
    const tenantName = 'DEFAULT'
    let tenant = await prisma.tenant.findFirst({
        where: { name: tenantName }
    })

    if (!tenant) {
        console.log(`Creating tenant: ${tenantName}`)
        tenant = await prisma.tenant.create({
            data: { name: tenantName }
        })
        console.log(`Tenant created: ${tenant.id}`)
    } else {
        console.log(`Tenant '${tenantName}' already exists. ID: ${tenant.id}`)
    }

    // 2. Ensure Admin User exists
    const adminEmail = 'admin@admin.com'
    const existingUser = await prisma.user.findFirst({
        where: { email: adminEmail, tenantId: tenant.id }
    })

    if (!existingUser) {
        console.log(`Creating admin user: ${adminEmail}`)
        const hash = await bcrypt.hash('Admin@123', 6)
        await prisma.user.create({
            data: {
                name: 'Administrador',
                email: adminEmail,
                passwordHash: hash,
                role: 'ADMIN',
                tenantId: tenant.id,
            }
        })
        console.log('✅ Admin user created successfully.')
    } else {
        console.log(`User '${adminEmail}' already exists. Skipping creation.`)
    }

    // 3. Seed official CCB data for ALL existing tenants
    const allTenants = await prisma.tenant.findMany()
    console.log(`\n📋 Seeding official CCB data for ${allTenants.length} tenant(s)...`)

    for (const t of allTenants) {
        console.log(`\n  Tenant: ${t.name} (${t.id})`)
        await seedFuncoes(t.id)
        await seedInstrumentos(t.id)
    }

    console.log('\n🌱 Seeding finished successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
