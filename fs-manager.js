const { promisify } = require('util')
const path = require('path')
const fs = require('fs')

const USERAVATAR = '../user-avatars'




module.exports = {
    getAvatar: (userId, filename) => {
        return promisify(fs.readFile)(
            path.join(USERAVATAR, '' + userId, filename).toString()
        )
    }
}







