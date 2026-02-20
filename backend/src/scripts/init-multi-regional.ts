
import { prisma } from '../infra/database/prisma.client'

async function initMultiRegional() {
    console.log('>>> Iniciando configuração multi-regional...')

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
        console.log('❌ Nenhum tenant encontrado.')
        return
    }

    // 1. Criar Regional Padrão (ATIBAIA)
    let regional = await prisma.regional.findFirst({
        where: { nome: 'ATIBAIA', tenantId: tenant.id }
    })

    if (!regional) {
        regional = await prisma.regional.create({
            data: {
                nome: 'ATIBAIA',
                setor: 'Sede',
                tenantId: tenant.id
            }
        })
        console.log(`✅ Regional ATIBAIA criada: ${regional.id}`)
    }

    // 2. Associar todos os eventos existentes a esta regional
    const eventosUpdate = await prisma.ensaioRegional.updateMany({
        where: { regionalId: null },
        data: { regionalId: regional.id }
    })
    console.log(`✅ ${eventosUpdate.count} eventos associados à regional ATIBAIA.`)

    // 3. Associar todos os usuários existentes a esta regional e atualizar Roles
    const users = await prisma.user.findMany()
    for (const user of users) {
        const updateData: any = { regionalId: regional.id }

        // Se era ADMIN, vira SUPERADMIN por enquanto para não perder acesso
        if ((user.role as any) === 'ADMIN') {
            updateData.role = 'SUPERADMIN'
        }

        await prisma.user.update({
            where: { id: user.id },
            data: updateData
        })
    }
    console.log(`✅ ${users.length} usuários atualizados e associados à regional ATIBAIA.`)

    console.log('>>> Configuração concluída!')
}

initMultiRegional()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
