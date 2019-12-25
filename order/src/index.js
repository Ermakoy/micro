const express = require('express')
const bodyParser = require('body-parser')
const { Photon } = require('@prisma/photon')

const photon = new Photon()
const app = express()

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.send('hello from order'))

app.get('/order', async (req, res) => {
  const result = await photon.items.findMany({});

  res.json(result)
})

app.get('/order/:id', async ({params}, res) => {
  const result = await photon.items.findOne({id: params.id})

  res.json(result)
})

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

const server = app.listen(3002, () =>
  console.log('🚀 Order Server ready', 3002)
)
