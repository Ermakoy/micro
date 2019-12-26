const express = require('express')
const bodyParser = require('body-parser')
const pino = require('express-pino-logger')
const { Photon } = require('@prisma/photon')
const amqp = require('amqplib')

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
    let q = 'update_amount_of_items';
    let ok = ch.assertQueue(q, {durable: false});
    ok = ok.then(function() {
      ch.prefetch(1);
      return ch.consume(q, reply);
    });
    return ok.then(function() {
      console.log(' [x] Awaiting update_amount_of_items requests');
    });

    async function reply(msg) {
      console.log(' [x] REPLY update_amount_of_items', msg.content.toString());
      const {params, body,replyQueue} = JSON.parse(msg.content.toString())
      let response 
      try {
        // TODO: doesnt work ((((
        //  const item = await photon.items.findOne({where: {id: params.id}})
        //  console.log({item})
        //  response = await photon.items.update({where: {id: params.id}, data: {amount: item.amount - 1}})
      } catch (e) {
        response = e
        console.log(e)
      }

      ch.sendToQueue(replyQueue,
                    Buffer.from(JSON.stringify({status: 'OK'})),
                    {correlationId: msg.properties.correlationId});
      ch.ack(msg);
    }
  });
}).catch(error => {
  console.log('Error in order', error)
});

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
