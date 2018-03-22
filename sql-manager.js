const mysql = require('mysql')
const serverConfig = require('../server-config.json')

const conn = mysql.createConnection(serverConfig.mysqlConfig)

function handleError(err) {
    throw err
}

module.exports = {
    hasUser: ({ userId, updateNum }) => {
        return new Promise((res, rej) => {
            conn.query('SELECT `user_id` FROM `users` WHERE ? AND ? LIMIT 1',
            [{ 'user_id': userId }, { 'update_num': updateNum }], (err, results) => {
                if (err) {
                    return handleError(err)
                }
                results.length === 1 ? res() : rej('invalid')
            })
        })
    },
    getUserId: username => {
        return new Promise((res, rej) => {
            conn.query('SELECT `user_id` AS `id` FROM `users` WHERE ? LIMIT 1', { username }, (err, results) => {
                if (err) {
                    return handleError(err)
                }
                const [user] = results
                user ? res(user.id) : rej()
            })
        })
    },
    friendRequest: (userId, id) => {
        return new Promise((res, rej) => {
            if (userId === id) {
                return rej()
            }
            // const sql = 'INSERT INTO `friend_request` '+
            // 'SELECT ? FROM DUAL WHERE NOT EXISTS(' +
            // 'SELECT `user_id1` FROM `friend_request` WHERE ? AND ? ' +
            // 'LIMIT 1)'
            
            // bug, select friends frist
            // const sql = 'INSERT IGNORE INTO `friend_request` SET ?'
            const minId = Math.min(userId, id)
            const maxId = Math.max(userId, id)
            const sql = 'INSERT IGNORE INTO `friend_request` ' +
            'SELECT ? FROM DUAL ' +
            'WHERE NOT EXISTS(' +
            'SELECT `user_id1` FROM `friends` WHERE ? AND ?)'
            conn.query(sql, [
                [minId, maxId], { 'user_id1': minId }, { 'user_id2': maxId }
            ], (err, results) => {
                if (err) {
                    return handleError(err)
                }
                const {affectedRows} = results
                affectedRows === 1 ? res() : rej()
            })
        })
    },
    friendRequestsIds: userId => {
        return new Promise((res, rej) => {
            const sql = 'SELECT `user_id1` AS `id` FROM `friend_request` WHERE ?'
            conn.query(sql, [{ 'user_id2': userId }], (err, results) => {
                if (err) {
                    return handleError(err)
                }
                res(results.map(x => x.id))
            })
        })
    },
    removeFriendRequest: (userId, id) => {
        return new Promise((res, rej) => {
            if (userId === id) {
                return rej()
            }
            const sql = 'DELETE FROM `friend_request` WHERE ? AND ? LIMIT 1'
            conn.query(sql, [{ 'user_id1': id }, { 'user_id2': userId }], (err, results) => {
                if (err) {
                    return handleError(err)
                }
                const {affectedRows} = results
                affectedRows === 1 ? res() : rej()
            })
        })
    },
    addFriend: (userId, id) => {
        return new Promise((res, rej) => {
            if (userId === id) {
                return rej()
            }
            const minId = Math.min(userId, id)
            const maxId = Math.max(userId, id)
            const sql = 'INSERT IGNORE INTO `friends` SET ?'
            conn.query(sql, { 'user_id1': minId, 'user_id2': maxId }, (err, results) => {
                if (err) {
                    return handleError(err)
                }
                const {affectedRows} = results
                affectedRows === 1 ? res() : rej()
            })
        })
    },
    getUserProfile: userId => {
        return new Promise((res, rej) => {
            conn.query(
                'SELECT `username`, `email`, `uname`, `gender`, `birthday`, `country`, `city` ' +
                'FROM `users` WHERE ? LIMIT 1',
                {'user_id': userId},
                (err, results) => {
                    if (err) {
                        return handleError(err)
                    }
                    results.length === 1 ? res(results[0]) : rej()
                })
        })
    },
    setUserProfile: (userId, profile) => {
        return new Promise((res, rej) => {
            const sql = 'UPDATE `users` SET ? WHERE ? LIMIT 1'
            conn.query(sql, [profile, { 'user_id': userId }], (err, results) => {
                if (err) {
                    return handleError(err)
                }
                const {affectedRows} = results
                affectedRows === 1 ? res() : rej()
            })
        })
    },
    getFriendsId: userId => {
        return new Promise((res, rej) => {
            conn.query('SELECT `user_id1` AS `id` FROM `friends` WHERE ?' +
            ' UNION ALL ' +
            'SELECT `user_id2` AS `id` FROM `friends` WHERE ?'
            , [{ 'user_id2': userId }, { 'user_id1': userId }], (err, friends) => {
                if (err) {
                    return handleError(err)
                }
                res(friends.map(x => x.id))
            })
        })
    },
    getPeopleProfile: ids => {
        return new Promise((res, rej) => {
            if (ids.length === 0) {
                res([])
                return
            }
            conn.query(
                'SELECT `username`, `uname`, `gender`, `birthday`, `country`, `city` ' +
                'FROM `users` WHERE `user_id` IN (?) LIMIT ?'
            , [
                ids, ids.length
            ], (err, profiles) => {
                if (err) {
                    return handleError(err)
                }
                res(profiles)
            })
        })
    }
}







// insert into friend_request
// select 12, 15 from dual
// where not exists(
// select user_id1 from friends
// where user_id1 = 12 and user_id2 = 15
// );