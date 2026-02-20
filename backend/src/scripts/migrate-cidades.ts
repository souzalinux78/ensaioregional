
import { prisma } from '../infra/database/prisma.client'
import { parseCidade } from '../shared/utils/normalization'

async function migrateCidades() {
    console.log('>>> Iniciando migração de cidades...')

    // Forçar atualização de todas as cidades para garantir consistência
    const cidades = await prisma.cidade.findMany({})

    console.log(`>>> Encontradas ${cidades.length} cidades para atualizar.`)

    for (const c of cidades) {
        // Se 'nomeExibicao' não existir, usamos o 'nome' (que era a string completa antigamente)
        const textToParse = c.nomeExibicao || c.nome
        const { cidade, bairro, exibicao } = parseCidade(textToParse)

        await prisma.cidade.update({
            where: { id: c.id },
            data: {
                nomeCidade: cidade,
                nomeBairro: bairro,
                nomeExibicao: exibicao
            }
        })
        console.log(`✅ Atualizado: "${textToParse}" -> ${cidade} (${bairro})`)
    }

    console.log('>>> Migração concluída com sucesso!')
}

migrateCidades()
    .catch(e => {
        console.error('❌ Erro na migração:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
