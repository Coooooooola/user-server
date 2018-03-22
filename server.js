const serverConfig = require('../server-config.json')
const jwt = require('jsonwebtoken')
const fastify = require('fastify')()
const redisManager = require('./redis-manager')
const sqlManager = require('./sql-manager')
const fsManager = require('./fs-manager')


fastify.addHook('preHandler', (request, reply, next) => {
    reply.header('Access-Control-Allow-Origin', 'http://localhost:3000')
    reply.header('Access-Control-Allow-Credentials', 'true')
    next()
})

fastify.options('*', (request, reply) => {
    reply.header('Access-Control-Allow-Methods', 'GET, PUST')
    reply.header('Access-Control-Allow-Headers', 'Content-Type')
    reply.send()
})


fastify.register(require('./user-resource'))

fastify.get('/user/:username/profile', {
    schema: {
        params: {
            username: { type: 'string', minLength: 2, maxLength: 30, pattern: '^[\\w_]{2,30}$' }
        }
    }
}, async (request, reply) => {
    const { params: { username } } = request
    try {
        const id = await sqlManager.getUserId(username)
        const [profile] = await sqlManager.getPeopleProfile([id])
        reply.send(profile)
    } catch (err) {
        reply.send('no')
    }
})



// move to nginx
fastify.get('/user/avatar/:id/:filename', {
    schema: {
        params: {
            type: 'object',
            properties: {
                id: { type: 'number', minValue: 0 },
                filename: {
                    type: 'string',
                    maxLength: 12,
                    minLength: 12,
                    pattern: '(?:\\w){8}\\.jpg'
                }
            },
            required: ['id', 'filename']
        }
    }
}, async (request, reply) => {
    const { id, filename } = request.params
    try {
        const pic = await fsManager.getAvatar(id, filename)
        reply.type('image/jpeg').send(pic)
    } catch (err) {
        reply.send()
    }
})









fastify.listen(8000, err => {
    if (err) {
        throw err
    }
})