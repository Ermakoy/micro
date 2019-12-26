const express = require('express')
const bodyParser = require('body-parser')
const { Photon } = require('@prisma/photon')

const photon = new Photon()
const app = express()

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.send('hello from order'))

app.get('/orders', async (req, res) => {
  const result = await photon.orders.findMany({});

  res.json(result)
})

app.get('/orders/:id', async ({params}, res) => {
  const result = await photon.orders.findOne({where: {id: params.id}})

  res.json(result)
})

app.post('/orders', async (req,res) => {
  const result = await photon.orders.create(req.body);

  res.json(result)
})

app.put('/orders/:id', async (req,res) => {
  const result = await photon.orders.update({where: {id: req.params.id}, data: req.body});

  res.json(result)
})

app.delete('/orders/:id', async (req, res) => {
  const result = await photon.orders.delete({where: {id: req.params.id}})

  res.json(result)
})

const server = app.listen(3002, () =>
  console.log('🚀 Order Server ready', 3002)
)
