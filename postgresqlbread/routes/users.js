var express = require('express');
var router = express.Router();
var path = require('path');
const moment = require('moment')
var { isLoggedInd } = require('../helper/util.js');


module.exports = function (db) {

  router.get('/', isLoggedInd, async (req, res, next) => {
    const { page = 1, title, startdate, enddate, complete, mode, sort = 'desc', sortby = 'id' } = req.query
    const params = []
    const queris = []
    const { rows: akun } = await db.query(' SELECT * FROM users WHERE id = $1', [req.session.user.userid])
    params.push(req.session.user.userid)


    if (title) {
      queris.push(`title ILIKE '%' || $${params.length + 1}  || '%'`)
      params.push(title)
    }

    if (startdate && enddate) {
      queris.push(` deadline BETWEEN $1 and $2`)
    }
    sql = `SELECT * FROM todos WHERE userid= $1`

    if (queris.length > 0) {
      sql += ` AND ${queris.join(`${mode}`)}`
    }
    db.query(sql, params, (err, { rows: data }) => {
      if (err) return res.send(err)
      res.render('users/list', { data, query: req.query, page, moment, akun: akun[0], user: req.session.user.userid })
    })
  })

  router.get('/add', isLoggedInd, (req, res) => {
    res.render('users/add')
  })


  router.post('/add', isLoggedInd, (req, res) => {
    db.query('INSERT INTO todos (title, userid) values ($1, $2)', [req.body.title, req.session.user.userid], (err) => {
      if (err) res.send(err)
      res.redirect('/users')
    })
  })

  router.get('/edit/:id', isLoggedInd, (req, res) => {
    const id = req.params.id
    db.query('SELECT * FROM todos WHERE id = $1', [id], (err, { rows: data }) => {
      if (err) return res.send(err)
      res.render('users/edit', { data, moment })
    })
  })


  return router;
}

