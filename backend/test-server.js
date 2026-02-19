
const Fastify = require('fastify')
const app = Fastify({ logger: true })

app.get('/', async () => ({ hello: 'world' }))

const start = async () => {
    try {
        await app.listen({ port: 3333, host: '0.0.0.0' })
        console.log('Minimal server listening on 3333')
    } catch (err) {
        console.error('SERVER ERROR:', err)
        process.exit(1)
    }
}

start()
