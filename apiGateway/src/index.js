const express = require('express')
const bodyParser = require('body-parser')
const got = require('got')

const app = express()

app.use(bodyParser.json())


app.get('/ping-warehouse', async (req, res) => {
  try {
    const {body} = await got('http://warehouse:3001/ping')
    res.status(200).send(body)
  } catch (e) {
    console.log('We not here((')
    res.status(500).send(e.message, 'warehouse host')
  }
})


app.get('/ping-order', async (req, res) => {
  try {
    const {body} = await got('http://order:3002/ping')
    res.send(body)
  } catch (e) {
    res.send(e.message)
  }
})

app.get('/ping-payment', async (req, res) => {
  try {
    const {body} = await got('http://payment:3003/ping')
    res.send(body)
  } catch (e) {
    res.send(e.message)
  }
})


const server = app.listen(3000, () =>
  console.log('🚀 API GATEWAY Server ready'),
)
