var express = require('express');
var router = express.Router();
var path = require('path');
const moment = require('moment')


module.exports = function (db) {

  router.get('/', async (req, res) => {
    const { page = 1, title, startdate, enddate, complete, mode, sort = 'desc', sortby = 'id' } = req.query
    const params = []
    const queris = []
    const { rows: akun } = await db.query(' SELECT * FROM users WHERE id = $1', [req.session.user.userid])
    if (title) {
      params.push(title)
      queris.push(` title ILIKE '%' ||$${params.length} || '%'`)
    }
    db.query(`SELECT * FROM todos WHERE userid=${params.length}`, (err, { rows }) => {
      if (err) return res.send(err)
      res.render('users/list', { data: rows, query: req.query, user: req.session.user, moment })
    })
  })

  router.get('/add', (req, res) => {
    res.render('users/add')
  })

  router.post('/add', (req, res) => {
    db.query('INSERT INTO todos (title, userid) values ($1, $2)', [req.body.title, req.session.user.userid], (err) => {
      console.log(req.session.user.userid)
      if (err) res.send(err)
      res.redirect('/users')
    })
  })


  return router;
}

