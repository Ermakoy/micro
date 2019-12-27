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
      // console.log('Reconnecting...')
    } else {
      console.log('Error in order connect', e)
    }
    await delay(1000)
    return connectToRabbitMQ()
  }
}

const app = express()

app.use(bodyParser.json())

connectToRabbitMQ().then(function(conn) {
  return conn.createChannel().then(function(ch) {
    var q = 'do_payment';
    var ok = ch.assertQueue(q, {durable: false});
    var ok = ok.then(function() {
      ch.prefetch(1);
      return ch.consume(q, reply);
    });
    return ok.then(function() {
      console.log(' [x] Awaiting do_payment requests');
    });

    async function reply(msg) {
      console.log(' [x] REPLY do_payment', msg.content.toString());
      try {
        const {params, body} = JSON.parse(msg.content.toString())
        // Do some payment

        // TODO: TypeError: Cannot read property 'create' of undefined
        // await photon.payment.create({data: {
        //   status: 'DONE',
        // }})

        ch.sendToQueue('mark_order_as_payd',
                    Buffer.from(JSON.stringify({params: { orderId: params.orderId },
                      replyQueue: msg.properties.replyTo})),
                    {correlationId: msg.properties.correlationId});
      } catch (e) {
        console.log(e)
      }

      ch.ack(msg);
    }
  });
}).catch(error => {
  console.log('Error in order', error)
});


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
  const result = await photon.payment.create({data: req.body});

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
