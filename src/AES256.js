const crypto = require('crypto')

const iv = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x03, 0x02, 0x01, 0x02, 0x03, 0x04, 0x03, 0x02, 0x01, 0x02, 0x03, 0x04]);

let AES256 = {
    aesKey: Buffer.from('NaAflJia!@$#%J0I-+Z_21549,a>,?<1', 'utf8'),
    encrypt: (text) => {
        let cipher = crypto.createCipheriv('aes-256-cbc', AES256.aesKey, iv)
        let result = cipher.update(text, 'utf8', 'base64')
        result += cipher.final('base64')
        return result
    },
    decrypt: (cryptogram) => {
        const decipher = crypto.createDecipheriv('aes-256-cbc', AES256.aesKey, iv)
        let result = decipher.update(cryptogram, 'base64', 'utf8')
        result += decipher.final('utf8')
        return result
    },
}
module.exports = AES256