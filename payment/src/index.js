const express = require('express')
const bodyParser = require('body-parser')
const { Photon } = require('@prisma/photon')

const photon = new Photon()
const app = express()

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.send('hello from payment'))

app.get('/payment', async (req,res) => {
  const result = await photon.payment.findMany({})

  res.json(result)
})

app.get('/payment/:id', async (req,res) => {
  const result = await photon.payment.findOne({where: {id: req.params.id}})

  res.json(result)
})

app.post('/payment', async (req,res) => {
  const result = await photon.payment.create(req.body);

  res.json(result)
})

app.put('/payment/:id', async (req,res) => {
  const result = await photon.payment.update({where: {id: req.params.id}, data: req.body});

  res.json(result)
})

app.delete('/payment/:id', async (req, res) => {
  const result = await photon.payment.delete({where: {id: req.params.id}})

  res.json(result)
})

const server = app.listen(3003, () =>
  console.log('Payment Server ready', 3003),
)
