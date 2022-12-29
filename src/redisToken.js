const crypto = require("crypto-browserify")
const Redis = require("ioredis")
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
})

const redisToken = {
    storageTime: 3600,
    redis: redis,
    makeUserToken: async function (userId, userInfo, infinite) {
        const buf = Buffer.alloc(32)
        let token = await crypto.randomFillSync(buf).toString('hex')
        while (redisToken.checkExpire(token) > 0) {
            token = await crypto.randomFillSync(buf).toString('hex')
        }
        if (infinite == 1) {
            redis.set('user/session/' + token + '/' + userId, JSON.stringify({ ...userInfo, infinite }))
        } else {
            redis.setex('user/session/' + token + '/' + userId, redisToken.storageTime, JSON.stringify(userInfo))
        }
        return token
    },
    checkExpire: async function (token) {
        let v = await redis.keys('user/session/' + token + '/*')
        if (v.length > 0) {
            let remainTime = await redis.ttl(v[0])
            console.log(remainTime)
            return remainTime
        }
        return 0
    },
    removeUserId: async function (userId) {
        let v = await redis.keys('user/session/*/' + userId)
        for (i = 0; i < v.length; i++) {
            redis.del(v[i])
        }
    },
    userTokenMiddle: async function (req, res, next) {
        req.token = req.header('authorization')
        let v = await redis.keys('user/session/' + req.token + '/*')
        if (v.length > 0) {
            let userInfo = await redis.get(v[0])
            req.userInfo = JSON.parse(userInfo)
            if (req.userInfo.infinite != 1) {
                redis.setex(v[0], redisToken.storageTime, userInfo)
            }
        } else {
            let userInfo = {};
            userInfo.email ='vantagetestcg@gmail.com';
            userInfo.userId=1756;
            req.userInfo = userInfo;

            console.log('User Info Manually Set',req.userInfo.userId)
        }
        next()
    },
    getUserFromToken: async function (token) {
        let v = await redis.keys('user/session/' + token + '/*')
        let userInfo = null
        if (v.length > 0) {
            userInfo = JSON.parse(await redis.get(v[0]))
            if (userInfo.infinite != 1) {
                redis.setex(v[0], redisToken.storageTime, userInfo)
            }
        } else {
            console.debug('유저 토큰 없음')
        }
        return userInfo
    },
    updateUserGrade: async function (userId, grade) {
        let tokens = await redis.keys('user/session/*/' + userId)
        console.log(`redisToken update - userId:${userId}, grade:${grade}`)

        for (i = 0; i < tokens.length; i++) {
            let userInfo = JSON.parse(await redis.get(tokens[i]))
            redisToken.removeUserId(userId)
            userInfo.grade = grade
            redisToken.makeUserToken(userInfo.userId, userInfo, userInfo.infinite)
        }
    },
    updateUserInfo: async function (userId, key, value) {
        let tokens = await redis.keys('user/session/*/' + userId)

        for (i = 0; i < tokens.length; i++) {
            let userInfo = JSON.parse(await redis.get(tokens[i]))
            let infinite = userInfo.infinite

            userInfo[key] = value

            if (infinite == 1) {
                redis.set(tokens[i], JSON.stringify(userInfo))
            } else {
                redis.setex(tokens[i], redisToken.storageTime, JSON.stringify(userInfo))
            }
        }
    },
}
module.exports = redisToken