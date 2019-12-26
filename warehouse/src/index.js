const express = require('express')
const bodyParser = require('body-parser')
const pino = require('express-pino-logger')
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

const json = fn => (req, res, next) => fn({params: req.params, body: req.body})
  .then(result => res.json(result))
  .catch(next)


app.use(bodyParser.json())
app.use(pino({prettyPrint: { colorize: true }}))

app.get('/ping', (req, res) => res.send('hello from warehouse'))

app.get('/items', json(() => photon.items.findMany({})))

app.get('/items/:id', json(({params}) => photon.items.findOne({where: {id: params.id}})))

app.post('/items', json(({body}) => photon.items.create({data: body})))

app.put('/items/:id', json(({params, body}) => photon.items.update({where: {id: params.id}, data: body})))

app.put('/items/:id/addition/:amount', json(({params, body}) => photon.items.update({where: {id: params.id}, data: {amount: Number(params.amount)}})))

app.delete('/items/:id', json(({params}) => photon.items.delete({where: {id: params.id}})))

app.use((err, req, res, next) => {
  console.error(err.message); // Log error message in our server's console
  if (!err.statusCode) err.statusCode = 500; // If err has no specified error code, set error code to 'Internal Server Error (500)'
  res.status(err.statusCode).send(err.message); // All HTTP requests must have a response, so let's send back an error with its status code and message
});

const server = app.listen(3001, () =>
  console.log('🚀 Warehouse Server ready', 3001),
)
