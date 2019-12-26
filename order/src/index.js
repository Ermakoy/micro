const express = require('express')
const bodyParser = require('body-parser')
const { Photon } = require('@prisma/photon')
// const amqp = require('amqplib')

// const getOrders = () => photon.orders.findMany({})

// amqp.connect('amqp://rabbitmq').then(function(conn) {
//   return conn.createChannel().then(function(ch) {
//     var ok = ch.assertQueue('order', {durable: false});

//     ok = ok.then(function(_qok) {
//       return ch.consume('updateOrderStatus', msg => {
//         console.log(" [x] Received '%s'", msg.content.toString())

//         if (msg.content.toString() === 'get') {
//           return photon.orders.findMany({}).then(result => {
//             ch.sendToQueue('order', Buffer.from(result));
//           })
//         }

//       }, {noAck: true});
//     });

//     return ok.then(function(_consumeOk) {
//       console.log(' [*] Waiting for messages. To exit press CTRL+C');
//     });
//   });
// }).catch(console.warn);

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
  const result = await photon.orders.create({data: req.body});

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
