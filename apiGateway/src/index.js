const express = require('express')
const bodyParser = require('body-parser')
const got = require('got')

const app = express()

app.use(bodyParser.json())


app.use('/ping-warehouse', async (req, res) => {
  try {
    const res = await got('http://localhost:3001/ping')
    res.send(res.body)
  } catch (e) {
    res.send(e.message)
  }
})


app.use('/ping-order', async (req, res) => {
  try {
    const res = await got('http://localhost:3002/ping')
    res.send(res.body)
  } catch (e) {
    res.send(e.message)
  }
})

app.use('/ping-payment', async (req, res) => {
  try {
    const res = await got('http://localhost:3003/ping')
    res.send(res.body)
  } catch (e) {
    res.send(e.message)
  }
})


const server = app.listen(3000, () =>
  console.log('🚀 API GATEWAY Server ready'),
)
