const express = require('express')
const bodyParser = require('body-parser')
const { Photon } = require('@prisma/photon')
const amqp = require('amqplib')
const pino = require('express-pino-logger')

const photon = new Photon()

const delay = ms => new Promise((resolve, reject) => setTimeout(resolve, ms))

const connectToRabbitMQ = async () => {
  try {
    const conn = await amqp.connect('amqp://rabbitmq')
    return conn
  } catch (e) {
    if (e.code === 'ECONNREFUSED') {
      console.log('Reconnecting...')
    } else {
      console.log('Error in order connect', e)
    }
    await delay(1000)
    return connectToRabbitMQ()
  }
}

connectToRabbitMQ().then(function(conn) {
  return conn.createChannel().then(function(ch) {
    var q = 'rpc_queue';
    var ok = ch.assertQueue(q, {durable: false});
    var ok = ok.then(function() {
      ch.prefetch(1);
      return ch.consume(q, reply);
    });
    return ok.then(function() {
      console.log(' [x] Awaiting RPC requests');
    });

    async function reply(msg) {
      console.log(' [x] REPLY?', msg);
      const response = await photon.orders.findMany({});

      ch.sendToQueue(msg.properties.replyTo,
                    Buffer.from(JSON.stringify(response)),
                    {correlationId: msg.properties.correlationId});
      ch.ack(msg);
    }
  });
}).catch(error => {
  console.log('Error in order', error)
});

const app = express()

app.use(pino({prettyPrint: { colorize: true }}))

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
