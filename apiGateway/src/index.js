const express = require('express')
const proxy = require('http-proxy-middleware')
const bodyParser = require('body-parser')
const pino = require('express-pino-logger')
const serializers = require('pino-std-serializers')
const got = require('got')
const amqp = require('amqplib')

let rabbitMqConnection = null

const WAREHOUSE_PING_QUEUE = 'warehouse-ping'

const connectToRabbitMQ = async () => {
  try {
    rabbitMqConnection = await amqp.connect('amqp://rabbitmq')
  } catch (e) {}
  if (!rabbitMqConnection) {
    setTimeout(connectToRabbitMQ, 1000)
    return
  }
}

connectToRabbitMQ()

const app = express()

app.use(pino({prettyPrint: { colorize: true }}))

app.use((req, res, next) => {
  rabbitMqConnection.createChannel().then(function(ch) {
    var q = 'logs';
    var msg = JSON.stringify(serializers.req(req));

    var ok = ch.assertQueue(q, {durable: false});

    return ok.then(function(_qok) {
      // NB: `sentToQueue` and `publish` both return a boolean
      // indicating whether it's OK to send again straight away, or
      // (when `false`) that you should wait for the event `'drain'`
      // to fire before writing again. We're just doing the one write,
      // so we'll ignore it.
      ch.sendToQueue(q, Buffer.from(msg));
      console.log(" [x] Sent '%s'", msg);
      // return ch.close();
    });
  })
  next()
})

/**  Get items => ItemDto<{id: number, name: string, amount: number, price: number}> */
app.use('/api/warehouse', proxy({ target: 'http://warehouse:3001', pathRewrite: {'^/api/warehouse' : ''}}))
app.use('/api/orders', proxy({ target: 'http://order:3002', pathRewrite: {'^/api' : ''}}))

app.use(bodyParser.json())

app.get('/ping-warehouse', async (req, res) => {
  try {
    const {body} = await got('http://warehouse:3001/ping')
    res.status(200).send('AAA' + body)
  } catch (e) {
    console.log('We not here((')
    res.status(500).send(e.message, 'warehouse host')
  }
})
// ---> apigateway ---> order create order, status not paid ---> payment ---> order, mark as paid ---> apigateway
// app.get('/api/order/:orderId', async (req, res) => {
//   try {
//     const {body} = await got('http://order:3002/getOrderById')
//     res.status(200).send(body)
//   } catch (e) {
//     console.log('We not here((')
//     res.status(500).send(e.message, 'warehouse host')
//   }
// })

app.get('/ping-warehouse-rabbit', async (req, res) => {
  // connectToRabbit().then(() => {
    rabbitMqConnection.sendToQueue(WAREHOUSE_PING_QUEUE, Buffer.from('HEY GIVE ME DATA'))
  // })
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
