const serverConfig = require('../server-config.json')
const redis = require('redis')

const SIGNUP = 1
const SIGNIN = 2
const ONLINE = 3

function handleError(err) {
    throw err
}

const client = redis.createClient(serverConfig.redisOptions)



module.exports = {
    setUser: ({ userId, updateNum }) => {
        return new Promise((res, rej) => {
            client.select(ONLINE)
            client.set(userId, updateNum, err => {
                if (err) {
                    handleError(err)
                }
                res()
            })
        })
    },
    hasUser: ({ userId, updateNum }) => {
        return new Promise((res, rej) => {
            client.select(ONLINE)
            client.get(userId, (err, num) => {
                if (err) {
                    handleError(err)
                }
                if (num === null) {
                    rej('not found')
                } else {
                    +num === +updateNum ? res() : rej('invalid')
                }
            })
        })
    },
    
    // getFrends: userId => {
    //     return new Promise((res, rej) => {
    //         client.select(ONLINE)
    //         client.lrange(userId, [0, -1], (err, data) => {
    //             if (err) {
    //                 return handleError(err)
    //             }
    //             res(data)
    //         })
    //     })
    // },
    // cacheFriends: (userId, friends) => {
    //     return new Promise((res, rej) => {
    //         client.select(ONLINE)
    //         client.lpush(userId, friends)
    //     })
    // }
}