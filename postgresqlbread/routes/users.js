var express = require('express');
var router = express.Router();
var path = require('path');
const moment = require('moment')
var { isLoggedInd } = require('../helpers/util.js');



module.exports = function (db) {

  router.get('/', isLoggedInd, async (req, res, next) => {
    const { page = 1,
      title,
      startdate,
      enddate,
      complete,
      mode,
    } = req.query
    const sort = req.query.sort === 'asc' ? 'asc' : 'desc'
    const sortBy = ['title', 'complete', 'deadline'].includes(req.query.sortBy) ? req.query.sortBy : 'id'
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

    if (complete) {
      queris.push(` complete = $${params.length + 1}`)
      params.push(complete)
      paramscount.push(complete)
    }
    sqlcount = `SELECT COUNT (*) as total FROM todos WHERE userid=$1`
    sql = `SELECT * FROM todos WHERE userid= $1`


    if (queris.length > 0) {
      sql += ` AND ${queris.join(`${mode}`)}`
      sqlcount += ` AND ${queris.join(`${mode}`)}`
    }

    sql += ` ORDER BY ${sortBy} ${sort}`
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    console.log(sql, params)
    db.query(sqlcount, paramscount, (err, data) => {
      if (err) res.send(err)
      const url = req.url == '/' ? `/?page=${page}&sortBy=${sortBy}&sort=${sort}` : req.url
      console.log(`ini url`, url)
      const total = data.rows[0].total
      const pages = Math.ceil(total / limit)
      db.query(sql, params, (err, { rows: data }) => {
        if (err) return res.send(err)
        res.render('users/list', { data, query: req.query, sort, sortBy, page, pages, offset, moment, akun: akun[0], user: req.session.user.userid, url })
      })
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

  router.get('/delete/:id', isLoggedInd, (req, res) => {
    const id = req.params.id
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


  router.post('/edit/:id', isLoggedInd, (req, res) => {
    const id = req.params.id
    const { complete } = req.body
    db.query(`UPDATE todos SET title=$1 , deadline=$2 , complete=$3 WHERE id=$4`, [req.body.title, req.body.deadline, Boolean(complete), id], (err) => {
      if (err) return res.send(err)
      res.redirect('/users')
    })
  })

  router.get(`/upload`, isLoggedInd, async (req, res) => {
    const { rows: akun } = await db.query(`SELECT * FROM users WHERE id = $1`, [req.session.user.userid])
    res.render('users/upload', { preAvatar: akun[0].avatar })
  })

  router.post('/upload', isLoggedInd, function (req, res) {

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
    const avatar = req.files.avatar;
    const fileName = `${Date.now()}-${avatar.name}`
    const uploadPath = path.join(__dirname, '..', 'public', 'images', fileName)

    avatar.mv(uploadPath, async function (err) {
      if (err)
        return res.status(500).send(err);
      const { rows } = await db.query(`UPDATE users SET avatar = $1 WHERE id = $2`, [fileName, req.session.user.userid])
      res.redirect('/users');
    });
  });



  return router;
}

