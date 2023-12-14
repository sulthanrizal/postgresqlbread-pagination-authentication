var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = function (db) {

  router.get('/', function (req, res, next) {
    res.render('login', { failedInfo: req.flash('failedInfo'), successInfo: req.flash('successInfo') });
  });

  router.post('/', async function (req, res, next) {
    try {
      const { email, password } = req.body
      const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
      if (rows.length == 0) {
        req.flash(`failedInfo`, `Email doesn't Exist`)
        return res.redirect('/')
      }

      const user = rows[0]
      if (!bcrypt.compareSync(password, user.password)) {
        req.flash(`failedInfo`, `Password is wrong`)
        return res.redirect('/')
      }

      req.session.user = { userid: rows[0].id, email: rows[0].email }

      res.redirect('/users')
    } catch (e) {

      res.redirect('/')
    }
  });

  router.get('/register', function (req, res, next) {
    res.render('register', { failedInfo: req.flash('failedInfo'), successInfo: req.flash('successInfo') });
  });


  router.post('/register', async function (req, res, next) {
    try {
      const { email, password, repassword } = req.body
      if (password !== repassword) {
        req.flash(`failedInfo`, `Password doesn't match`)
        return res.redirect('/register')
      }

      const { rows: emails } = await db.query('SELECT * FROM users WHERE email = $1', [email])

      if (emails.length > 0) {
        req.flash(`failedInfo`, `Email already Exist`)
        return res.redirect('/register')
      }

      const hash = bcrypt.hashSync(password, saltRounds);
      await db.query('INSERT INTO users(email,password) VALUES($1,$2)', [email, hash])
      req.flash(`successInfo`, `succesfully registered , please sign in`)
      res.redirect('/')
    } catch (error) {
      res.send(error.message)
      res.redirect('/register')
    }
  });

  router.get('/logout', (req, res, next) => {
    req.session.destroy(function (err) {
      res.redirect('/')
    })
  })

  return router;
}