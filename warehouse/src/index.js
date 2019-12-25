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

app.post(`/user`, async (req, res) => {
  const result = await photon.users.create({
    data: {
      ...req.body,
    },
  })
  res.json(result)
})

app.post(`/post`, async (req, res) => {
  const { title, content, authorEmail } = req.body
  const result = await photon.posts.create({
    data: {
      title: title,
      content: content,
      author: { connect: { email: authorEmail } },
    },
  })
  res.json(result)
})

app.put('/publish/:id', async (req, res) => {
  const { id } = req.params
  const post = await photon.posts.update({
    where: { id },
    data: { published: true },
  })
  res.json(post)
})

app.delete(`/post/:id`, async (req, res) => {
  const { id } = req.params
  const post = await photon.posts.delete({
    where: {
      id,
    },
  })
  res.json(post)
})

app.get(`/post/:id`, async (req, res) => {
  const { id } = req.params
  const post = await photon.posts.findOne({
    where: {
      id,
    },
  })
  res.json(post)
})

app.get('/feed', async (req, res) => {
  const posts = await photon.posts.findMany({ where: { published: true } })
  res.json(posts)
})

app.get('/filterPosts', async (req, res) => {
  const { searchString } = req.query
  const draftPosts = await photon.posts.findMany({
    where: {
      OR: [
        {
          title: {
            contains: searchString,
          },
        },
        {
          content: {
            contains: searchString,
          },
        },
      ],
    },
  })
  res.json(draftPosts)
})

const server = app.listen(3001, () =>
  console.log('🚀 Warehouse Server ready', 3001),
)
