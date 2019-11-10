// 构建TCP连接服务 客户端
const net = require('net')
const types = require('./types')

// 服务器配置
const host = 'localhost'
const port = 5001

let nickname = null

// 创建一个客户端实例
const client = net.createConnection({ host, port })

// 监听连接事件
client.on('connect', () => {
  // console.log(`'连接服务器[${host}:${port}]成功'`)
  console.log('连接服务器成功')
  // 在服务器连接成功过后提示用户输入昵称
  process.stdout.write('请输入昵称:')

  process.stdin.on('data', data => {
    data = data.toString().trim()
    // 如果没有昵称，则用户输入内容为设置昵称
    if (!nickname) {
      return client.write(JSON.stringify({
        type: types.login,
        nickname: data
      }))
    }

    const matches = /^@(\w+)\s(.+)$/.test(data)

    // 如果本次消息符合@格式，则说明是私聊消息
    if (matches) {
      // console.log('matches', data.split('@')[1].split(' ')[0])
      // console.log('matches', data.split(' ')[0].length)
      return client.write(JSON.stringify({
        type: types.p2p,
        nickname: data.split('@')[1].split(' ')[0],
        message: data.substr(data.split(' ')[0].length)
      }))
    }

    client.write(JSON.stringify({
      type: types.broadcast,
      nickname,
      message: data
    }))

  })
})

// 在终端打印服务端发送过来的消息
client.on('data', data => {
  // console.log('服务端消息', data.toString().trim())
  data = JSON.parse(data.toString().trim())

  // 登陆
  if (data.type === types.login) {
    if (!data.success) {
      console.log('登陆失败:', data.message)
      process.stdout.write('请输入昵称:')
    } else {
      console.log('登陆成功，当前在线用户' + data.sumUsers)
      return nickname = data.nickname
    }
  }

  // 广播
  if (data.type === types.broadcast) {
    console.log(`${data.nickname}:${data.message}`)
    // return console.log(data.time)
  }

  // 私聊
  if (data.type === types.p2p) {
    if (!data.success) {
      return console.log(`发送失败:${data.message}`)
    }
    console.log(`${data.nickname}对你说：${data.message}`)
    // return console.log(data.time)
  }

  // 服务器提示消息
  if (data.type === types.tip) {
    console.log(data.message)
    // return console.log(data.time)
  }

})