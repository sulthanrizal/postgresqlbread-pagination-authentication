module.exports = {
    isLoggedInd: function (req, res, next) {
        if (req.session.user) {
            next()
        } else {
            res.redirect('/')
        }
        console.log('LOGGED')
    }
}