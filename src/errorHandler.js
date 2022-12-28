const defError = {
    status: 500,
    code: '99',
    message: '오류가 발생하였습니다.',
}
module.exports = {
    handleError: (err, res, message) => {
        // err.original : sequelize db error object
        console.error(err.original || err)
        if (typeof err == 'object') {
            res.send({
                ...defError,
                message: message || '오류가 발생하였습니다.',
                ...err,
            })
        } else {
            res.send(defError)
        }
    }
}