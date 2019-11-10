// 构建TCP服务 服务端
const net = require('net')
const types = require('./types')

// 配置端口号
let port = 5001

// 创建一个服务器实例
const server = net.createServer()

// 存放客户端连接
const users = []

server.on('connection', clientSocket => {
  console.log('有新客户端连接')
  // 广播消息
  // 把服务端终端输入的内容群发给所有客户端
  process.stdin.on('data', data => {
    // 把终端中输入的数据发送给客户端
    clientSocket.write(JSON.stringify({
      type: types.tip,
      message: '系统消息:' + data.toString().trim(),
      time: new Date()
    }))
  })

  clientSocket.on('data', data => {
    console.log('收到客户端消息:' + data)
    // 把收到的二进制格式的数据，转换成对象格式数据
    data = JSON.parse(data.toString().trim())

    // 如果类型为login 则执行登陆操作
    if (data.type === types.login) {
      // 判断昵称是否重复
      if (users.find(item => item.nickname === data.nickname)) {
        return clientSocket.write(JSON.stringify({
          type: types.login,
          success: false,
          message: '该昵称已重复',
          time: new Date()
        }))
      }
      clientSocket.nickname = data.nickname
      // 把当前连接的客户端通信接口存储到数据中
      users.push(clientSocket)
      clientSocket.write(JSON.stringify({
        type: types.login,
        success: true,
        message: '登陆成功！',
        // 当前登陆人数
        sumUsers: users.length,
        // 用户昵称
        nickname: data.nickname,
        time: new Date()
      }))
      users.forEach(item => {
        if (item.nickname !== data.nickname) {
          item.write(JSON.stringify({
            type: types.tip,
            message: `【${data.nickname}】加入了群聊,当前在线人数${users.length}`,
            time: new Date()
          }))
        }
      })
    }

    // 如果类型为broadcast，执行广播操作
    if (data.type === types.broadcast) {
      users.forEach(item => {
        // 把消息发送给其他客户端
        if (item.nickname !== data.nickname) {
          item.write(JSON.stringify({
            type: types.broadcast,
            nickname: clientSocket.nickname,
            message: data.message,
            time: new Date()
          }))
        }
      })
    }

    // 如果类型为p2p，执行私聊相关操作
    if (data.type === types.p2p) {
      const user = users.find(item => item.nickname === data.nickname)
      // 失败
      if (!user) {
        return clientSocket.write(JSON.stringify({
          type: types.p2p,
          success: false,
          message: '该用户不存在',
          time
        }))
      }
      // 如果成功
      user.write(JSON.stringify({
        type: types.p2p,
        success: true,
        nickname: clientSocket.nickname,
        message: data.message,
        time
      }))
    }
  })

  // 监听客户端离线
  // 清除离线用户
  clientSocket.on('end', () => {
    const index = users.findIndex(item => item.nickname === clientSocket.nickname)
    users.splice(index, 1)
    users.forEach(item => {
      item.write(JSON.stringify({
        type: types.tip,
        message: `【${clientSocket.nickname}】离开了群聊，当前在线人数${users.length}`,
        time: new Date()
      }))
    })
  })
})

server.listen(port, () => {
  console.log(`Server running At ${port}`)
})
