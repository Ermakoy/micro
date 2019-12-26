const amqp = require('amqplib');

const delay = ms => new Promise((resolve, reject) => setTimeout(resolve, ms))

const connectToRabbitMQ = async () => {
  try {
    return amqp.connect('amqp://rabbitmq')
  } catch (e) {}
  if (!rabbitMqConnection) {
    await delay(1000)
    return connectToRabbitMQ()
  }
}

connectToRabbitMQ()

connectToRabbitMQ().then(function(conn) {
  return conn.createChannel().then(function(ch) {

    let ok = ch.assertQueue('logs', {durable: false});

    ok = ok.then(function(_qok) {
      return ch.consume('logs', function(msg) {
        console.log(" [x] Received '%s'", msg.content.toString());
      }, {noAck: true});
    });

    return ok.then(function(_consumeOk) {
      console.log(' [*] Waiting for messages. To exit press CTRL+C');
    });
  });
}).catch(console.warn);
