
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Attempting to connect...')
    await prisma.$connect()
    console.log('Connection successful!')
    
    const count = await prisma.tenant.count().catch(() => 0) // Just to test query
    console.log('Query successful, tenant count:', count)
    
  } catch (e: any) {
    console.error('CONNECTION ERROR:')
    console.error(e.message)
    console.error('ERROR CODE:', e.code)
    console.error('META:', e.meta)
  } finally {
    await prisma.$disconnect()
  }
}

main()
