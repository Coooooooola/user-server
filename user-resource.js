const serverConfig = require('../server-config.json')
const jwt = require('jsonwebtoken')
const redisManager = require('./redis-manager')
const sqlManager = require('./sql-manager')
const fsManager = require('./fs-manager')

const uname = { type: 'string', minLength: 1, maxLength: 30 }
const gender = { type: 'string', pattern: 'MALE|FEMALE' }
const birthday = { type: 'string' }
const country = { type: 'string', pattern: 'Australia|Canada|China|Japan|Korea|France|Germany|United Kimdom|United State|other' }
const city = { type: 'string', minLength: 1, maxLength: 20 }
const bio = { type: 'string', minLength: 0, maxLength: 120 }



module.exports = function (fastify, options, next) {
    
    fastify.register(require('fastify-cookie'))
    
    fastify.addHook('preHandler', (request, reply, next) => {
        const { UID } = request.cookies
        if (!UID) {
            reply.send({msg: 'please signin.'})
            return
        }
        jwt.verify(UID, serverConfig.serect, (err, { identifier }) => {
            if (err) {
                reply.send({ err })
                return
            }
            redisManager.hasUser(identifier)
            .then(() => {
                request.userId = identifier.userId
                next()
            })
            .catch(err => {
                if (err === 'invalid') {
                    reply.send({ msg: 'invalid UID' })
                    return
                }
                sqlManager.hasUser(identifier)
                .then(() => {
                    redisManager.setUser(identifier)
                    request.userId = identifier.userId
                    next()
                })
                .catch(err => reply.send({ msg: 'UID not found.' }))
            })
        })
    })
    
    fastify.get('/user/u/profile', async (request, reply) => {
        const { userId } = request
        try {
            const profile = await sqlManager.getUserProfile(userId)
        reply.send(profile)
    } catch (err) {
        reply.send(err)
    }
    })
    
    
    fastify.post('/user/profile', {
    schema: {
        body: {
            type: 'object',
            properties: { uname, gender, birthday, country, city, bio }
        }
    }
    }, async (request, reply) => {
    const { userId, body: profile } = request
    try {
        await sqlManager.setUserProfile(userId, profile)
        reply.send('set')
    } catch (err) {
        reply.send('cannot set')
    }
    })
    
    
    
    fastify.get('/user/friend-profiles', async (request, reply) => {
    const { userId } = request
    try {
        const ids = await sqlManager.getFriendsId(userId)
        const profiles = await sqlManager.getPeopleProfile(ids)
        reply.send(profiles)
    } catch (err) {
        reply.send()
    }
    })
    
    
    
    const usernameSchema = {
    querystring: {
        type: 'object',
        properties: {
            username: {
                type: 'string'
            }
        },
        required: ['username']
    }
    }
    
    fastify.get('/user/friend-request', {
    schema: usernameSchema
    }, async (request, reply) => {
    const { userId, query: { username } } = request
    try {
        const id = await sqlManager.getUserId(username)
        await sqlManager.friendRequest(userId, id)
        reply.send({ msg: 'ok' })
    } catch (err) {
        reply.send({ msg: 'fail' })
    }
    })
    
    fastify.get('/user/friend-request-profiles', async (request, reply) => {
    const { userId } = request
    try {
        const ids = await sqlManager.friendRequestsIds(userId)
        const profiles = await sqlManager.getPeopleProfile(ids)
        reply.send(profiles)
    } catch (err) {
        reply.send('ooooops err')
    }
    })
    
    fastify.get('/user/accept-friend-request', {
    schema: usernameSchema
    }, async (request, reply) => {
    const { userId, query: { username } } = request
    try {
        const id = await sqlManager.getUserId(username)
        await sqlManager.addFriend(userId, id)
        await sqlManager.removeFriendRequest(userId, id)
        reply.send('ok')
    } catch (err) {
        reply.send('no')
    }
    })
    
    fastify.get('/user/reject-friend-request', {
    schema: usernameSchema
    }, async (request, reply) => {
    const { userId, query: { username } } = request
    try {
        const id = await sqlManager.getUserId(username)
        await sqlManager.removeFriendRequest(userId, id)
        reply.send('rejected')
    } catch (err) {
        reply.send('fail to reject')
    }
    })
    
    
    
    

    next()
}    
    
