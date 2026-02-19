
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Iniciando migração de cidades ---')

    const cidades = await prisma.cidade.findMany()

    for (const cidade of cidades) {
        const nomeOriginal = cidade.nome
        let nomeCidade = ''
        let nomeBairro = null
        let nomeExibicao = nomeOriginal

        if (nomeOriginal.includes(' - ')) {
            const parts = nomeOriginal.split(' - ')
            nomeCidade = parts[0].trim().toUpperCase()
            nomeBairro = parts[1].trim().toUpperCase()
            nomeExibicao = `${nomeCidade} - ${nomeBairro}`
        } else {
            nomeCidade = nomeOriginal.trim().toUpperCase()
            nomeBairro = null
            nomeExibicao = nomeCidade
        }

        console.log(`Migrando: [${nomeOriginal}] -> Cidade: [${nomeCidade}], Bairro: [${nomeBairro}]`)

        await prisma.cidade.update({
            where: { id: cidade.id },
            data: {
                nomeCidade,
                nomeBairro,
                nomeExibicao
            }
        })
    }

    console.log('--- Migração concluída com sucesso ---')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
