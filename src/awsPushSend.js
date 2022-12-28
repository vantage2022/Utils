const aws = require('aws-sdk')
const sns = new aws.SNS({
    apiVersion: '2010-03-31',
    region: 'ap-northeast-2',
})

const awsPushSend = {
    /**
     * Get non-topic-group user list by filter
     * #caller adminfront 
     * @param {string} title push title
     * @param {string} subTitle push subTitle
     * @param {string} endpoint userInfo.tokenArn
     * @returns {Object} sns.publish result
     */
    sendPush: async function (params) {
        return new Promise( (resolve, reject) => {
            const messageTemplate = {
                notification: {
                    title: params.title,
                    body: params.subTitle,
                },
            }
    
            let payload = {
                default: messageTemplate,
                APNS: {
                    aps: messageTemplate
                },
                GCM: messageTemplate,
            }
    
            Object.keys(payload).forEach(key => payload[key] = JSON.stringify(payload[key]).replace(/\"/g, '\"'))
            payload = JSON.stringify(payload);
    
            sns.publish({
                Message: payload,
                MessageStructure: 'json',
                TargetArn: params.endpoint,
            }, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            });
        })
    }
}

module.exports = awsPushSend
