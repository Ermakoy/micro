const express = require('express')
const bodyParser = require('body-parser')
const got = require('got')
const amqp = require('amqplib/callback_api')

let rabbitMqConnection = null

const WAREHOUSE_PING_QUEUE = 'warehouse-ping'

function connectToRabbit() { 
  // return new Promise((resolve, reject) => {
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

        // resolve(channel)
      });
    });
  // })
}

connectToRabbit()

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
