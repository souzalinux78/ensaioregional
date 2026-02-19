
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Iniciando migração SQL de cidades ---')

    await prisma.$executeRawUnsafe(`
        UPDATE cidades 
        SET 
            nome_cidade = TRIM(UPPER(SUBSTRING_INDEX(nome, ' - ', 1))),
            nome_bairro = CASE 
                WHEN nome LIKE '% - %' THEN TRIM(UPPER(SUBSTRING_INDEX(nome, ' - ', -1)))
                ELSE NULL 
            END,
            nome_exibicao = CASE 
                WHEN nome LIKE '% - %' THEN CONCAT(TRIM(UPPER(SUBSTRING_INDEX(nome, ' - ', 1))), ' - ', TRIM(UPPER(SUBSTRING_INDEX(nome, ' - ', -1))))
                ELSE TRIM(UPPER(nome))
            END
    `)

    console.log('--- Migração SQL concluída ---')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
