const express = require('express')
const bodyParser = require('body-parser')
const { Photon } = require('@prisma/photon')

const amqp = require('amqplib/callback_api')

let rabbitMqConnection = null

const WAREHOUSE_PING_QUEUE = 'warehouse-ping'

function connectToRabbit() {
  amqp.connect('amqp://rabbitmq', function (err, conn) {
    if (!conn) {
        setTimeout(connectToRabbit, 1000)
        return
      }
    conn.createChannel(function (err, channel) {
      rabbitMqConnection = channel

      rabbitMqConnection.assertQueue(WAREHOUSE_PING_QUEUE, {
        durable: false
      })

      rabbitMqConnection.consume(WAREHOUSE_PING_QUEUE, (msg) => {
        console.log('RECEIVED:', msg.content.toString())
      })
    });
  });
}

connectToRabbit()

const photon = new Photon()
const app = express()

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.send('hello from warehouse'))

app.get('/items', async (req,res) => {
  const result = await photon.items.findMany({})

  res.json(result)
})

app.get('/items/:id', async (req,res) => {
  const result = await photon.items.findOne({where: {id: req.params.id}})

  res.json(result)
})

app.post('/items', async (req,res) => {
  const result = await photon.items.create({data: req.body});

  res.json(result)
})

app.put('/items/:id', async (req,res) => {
  const result = await photon.items.update({where: {id: req.params.id}, data: req.body});

  res.json(result)
})

app.delete('/items/:id', async (req, res) => {
  const result = await photon.items.delete({where: {id: req.params.id}})

  res.json(result)
})

const server = app.listen(3001, () =>
  console.log('🚀 Warehouse Server ready', 3001),
)
