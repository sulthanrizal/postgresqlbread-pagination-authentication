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
    const paramscount = []
    const limit = 5
    const offset = (page - 1) * 5
    const { rows: akun } = await db.query(' SELECT * FROM users WHERE id = $1', [req.session.user.userid])
    params.push(req.session.user.userid)
    paramscount.push(req.session.user.userid)


    if (title) {
      queris.push(`title ILIKE '%' || $${params.length + 1}  || '%'`)
      params.push(title)
      paramscount.push(title)
    }

    if (startdate && enddate) {
      queris.push(`deadline BETWEEN  $${params.length + 1} and $${params.length + 2}::TIMESTAMP +  INTERVAL' 1 DAY - 1 SECOND' `)
      params.push(startdate, enddate)
      paramscount.push(startdate, enddate)
    }
    if (startdate) {
      queris.push(`deadline >= $${params.length + 1}`)
      params.push(startdate)
      paramscount.push(startdate)
    }
    if (enddate) {
      queris.push(`deadline <= $${params.length + 1}::TIMESTAMP + INTERVAL '1 DAY - 1 SECOND'`)
      params.push(enddate)
      paramscount.push(enddate)
    }
    sqlcount = `SELECT COUNT (*) as total FROM todos WHERE userid=$1`
    sql = `SELECT * FROM todos WHERE userid= $1`

    if (queris.length > 0) {
      sql += ` AND ${queris.join(`${mode}`)}`
      sqlcount += ` AND ${queris.join(`${mode}`)}`
    }
    sql += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    console.log(sql, params, sqlcount, paramscount)

    db.query(sqlcount, paramscount, (err, data) => {
      if (err) res.send(err)
      const total = data.total
      const pages = Math.ceil(total / limit)
      db.query(sql, params, (err, { rows: data }) => {
        if (err) return res.send(err)
        res.render('users/list', { data, query: req.query, page, pages, offset, moment, url: req.url, akun: akun[0], user: req.session.user.userid })
      })
    })
    // console.log(sql, params)
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

  router.get('/delete/:id', isLoggedInd, (req, res) => {
    const id = req.params.id
    console.log(id)
    db.query('DELETE FROM todos WHERE id = $1', [id], (err) => {
      if (err) return res.send(err)
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

  // router.post('/edit/:id')


  return router;
}

