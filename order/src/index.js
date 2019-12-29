const express = require('express')
const got = require('got');
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
//      console.log('Reconnecting...')
    } else {
      console.log('Error in order connect', e)
    }
    await delay(1000)
    return connectToRabbitMQ()
  }
}

connectToRabbitMQ().then(connection =>
  connection.createChannel().then(channel => {
    let q = 'create_order';
    var ok = channel.assertQueue(q, { durable: false });
    var ok = ok.then(function() {
      channel.prefetch(1);
      return channel.consume(q, reply);
    });
    return ok.then(function() {
      console.log(' [x] Awaiting create_order requests');
    });

    async function reply(msg) {
      const {params, body} = JSON.parse(msg.content.toString())
      console.log(' [x] Crete_order REPLY', msg.content.toString());
      const payment = await got.post('http://payment:3003/payment')
      console.log('creating order', payment,body.body)
      const response = await photon.orders.create({data: {...body.body, paymentId: payment.id}});
      console.log('i am new payment',payment)
      channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response)), {
        correlationId: msg.properties.correlationId
      });
      channel.ack(msg);
    }
  })
);


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
      console.log(' [x] REPLY', msg.content.toString());
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

connectToRabbitMQ().then(function(conn) {
  return conn.createChannel().then(function(ch) {
    var q = 'rpc_queue2';
    var ok = ch.assertQueue(q, {durable: false});
    var ok = ok.then(function() {
      ch.prefetch(1);
      return ch.consume(q, reply);
    });
    return ok.then(function() {
      console.log(' [x] Awaiting RPC requests');
    });

    async function reply(msg) {
      console.log(' [x] REPLY', msg.content.toString());
      const {params, body} = JSON.parse(msg.content.toString())
      const response = await photon.orders.findOne({where: {id: params.id}})

      ch.sendToQueue(msg.properties.replyTo,
                    Buffer.from(JSON.stringify(response)),
                    {correlationId: msg.properties.correlationId});
      ch.ack(msg);
    }
  });
}).catch(error => {
  console.log('Error in order', error)
});

connectToRabbitMQ().then(function(conn) {
  return conn.createChannel().then(function(ch) {
    var q = 'change_order_status';
    var ok = ch.assertQueue(q, {durable: false});
    var ok = ok.then(function() {
      ch.prefetch(1);
      return ch.consume(q, reply);
    });
    return ok.then(function() {
      console.log(' [x] Awaiting change_order_status requests');
    });

    async function reply(msg) {
      console.log(' [x] REPLY change_order_status', msg.content.toString());
      const {params, body} = JSON.parse(msg.content.toString())
      console.log(`Set status ${params.status} to order with id ${params.orderId}`)
      let response
      try {
        response = await photon.orders.update({where: {id: params.orderId}, data: {
          status: params.status
        }})
      } catch (e) {
        response = e
      }
      ch.sendToQueue(msg.properties.replyTo,
                    Buffer.from(JSON.stringify(response)),
                    {correlationId: msg.properties.correlationId});
      ch.ack(msg);
    }
  });
}).catch(error => {
  console.log('Error in order', error)
});


connectToRabbitMQ().then(function(conn) {
  return conn.createChannel().then(function(ch) {
    let q = 'mark_order_as_payd';
    let ok = ch.assertQueue(q, {durable: false});
    ok = ok.then(function() {
      ch.prefetch(1);
      return ch.consume(q, reply);
    });
    return ok.then(function() {
      console.log(' [x] Awaiting mark_order_as_payd requests');
    });

    async function reply(msg) {
      console.log(' [x] REPLY mark_order_as_payd', msg.content.toString());
      const {params, body,replyQueue} = JSON.parse(msg.content.toString())
      let response
      try {
        response = await photon.orders.update({where: {id: params.orderId}, data: {status: 'PAYED'}})
      } catch (e) {
        response = e
        console.log(e)
      }

      ch.sendToQueue(replyQueue,
                    Buffer.from(JSON.stringify(response)),
                    {correlationId: msg.properties.correlationId});
      ch.ack(msg);
    }
  });
}).catch(error => {
  console.log('Error in order', error)
});

connectToRabbitMQ().then(function(conn) {
  return conn.createChannel().then(function(ch) {
    var q = 'add_item_to_order';
    var ok = ch.assertQueue(q, {durable: false});
    var ok = ok.then(function() {
      ch.prefetch(1);
      return ch.consume(q, reply);
    });
    return ok.then(function() {
      console.log(' [x] Awaiting add_item_to_order requests');
    });

    async function reply(msg) {
      console.log(' [x] REPLY add_item_to_order', msg.content.toString());
      try {
        const {params, body} = JSON.parse(msg.content.toString())
          
          // TODO: there is an error:
          // const order = await photon.orders.findOne({where: {id: params.orderId}})
          // response = await photon.orders.update({
          //     where: {id: params.orderId},
          //     data: {
          //       itemDto: [...(order.itemDto || []), {itemId: params.itemId, amount: 1}]
          //     }
          // })
          
        ch.sendToQueue('update_amount_of_items',
                    Buffer.from(JSON.stringify({params: { id: params.itemId, amount: params.amount || 1 },
                      replyQueue: msg.properties.replyTo})),
                    {correlationId: msg.properties.correlationId});
      } catch (e) {}
        
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
  const {id} = await got.post('http://payment:3003/payment');
  const result = await photon.orders.create({data: {...req.body, paymentId: id}});

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
