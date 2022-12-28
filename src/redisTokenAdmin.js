const crypto = require("crypto-browserify")
const Redis = require("ioredis")
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
})

const redisTokenAdmin = {
    storageTime: 3600,
    redis: redis,
    makeAdminToken: async function (userId, adminInfo, infinite) {
        const buf = Buffer.alloc(32)
        let token = await crypto.randomFillSync(buf).toString('hex')
        while (redisTokenAdmin.checkExpire(token) > 0) {
            token = await crypto.randomFillSync(buf).toString('hex')
        }
        if (infinite == 1) {
            redis.set('admin/session/' + token + '/' + userId, JSON.stringify({ ...adminInfo, infinite }))
        } else {
            redis.setex('admin/session/' + token + '/' + userId, redisTokenAdmin.storageTime, JSON.stringify(adminInfo))
        }
        return token
    },
    checkExpire: async function (token) {
        let v = await redis.keys('admin/session/' + token + '/*')
        if (v.length > 0) {
            let remainTime = await redis.ttl(v[0])
            console.log(remainTime)
            return remainTime
        }
        return 0
    },
    removeAdminId: async function (userId) {
        let v = await redis.keys('admin/session/*/' + userId)
        for (i = 0; i < v.length; i++) {
            redis.del(v[i])
        }
    },
    adminTokenMiddle: async function (req, res, next) {
        req.token = req.header('admin-authorization')
        let v = await redis.keys('admin/session/' + req.token + '/*')
        if (v.length > 0) {
            let adminInfo = await redis.get(v[0])
            req.adminInfo = JSON.parse(adminInfo)
            if (req.adminInfo.infinite != 1) {
                redis.setex(v[0], redisTokenAdmin.storageTime, adminInfo)
            }
        } else {
            console.debug('Admin 토큰 없음')
        }
        next()
    },
    getAdminFromToken: async function (token) {
        let v = await redis.keys('admin/session/' + token + '/*')
        let adminInfo = null
        if (v.length > 0) {
            adminInfo = JSON.parse(await redis.get(v[0]))
            if (req.adminInfo.infinite != 1) {
                redis.setex(v[0], redisTokenAdmin.storageTime, adminInfo)
            }
        } else {
            console.debug('토큰이 없는데 조회하려 했음')
        }
        return adminInfo
    },
}

module.exports = redisTokenAdmin