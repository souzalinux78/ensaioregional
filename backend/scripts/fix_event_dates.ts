
import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'

const prisma = new PrismaClient()

async function main() {
    const events = await prisma.ensaioRegional.findMany({
        where: {
            dataHoraInicio: null
        }
    })

    console.log(`Encontrados ${events.length} eventos para atualizar.`)

    for (const event of events) {
        const start = dayjs(event.dataEvento).startOf('day').toDate()
        const end = dayjs(event.dataEvento).endOf('day').toDate()

        await prisma.ensaioRegional.update({
            where: { id: event.id },
            data: {
                dataHoraInicio: start,
                dataHoraFim: end
            }
        })
        console.log(`Evento "${event.nome}" atualizado: ${start} -> ${end}`)
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
