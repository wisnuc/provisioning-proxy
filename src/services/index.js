const request = require('superagent')
const EventEmitter = require('events')

class State {
  
  constructor (ctx, ...args) {
    this.ctx = ctx
    this.ctx.state = this
    this.enter(...args)
  }

  setState (State, ...args) {
    this.exit()
    new State(this.ctx, ...args)
  }

  enter (...args) {

  }

  exit (...args) {

  }
}

class Pending extends State {
  
  enter() {
    console.log('进入等待状态...')
    process.stdout.write('请输入KEY：')
    process.stdin.on('data', chunk => {
      let key = chunk.toString().trim()
      this.setState(Checking, key)
    })
  }

  exit() {
    process.stdin.removeAllListeners()
  }
}

class Failed extends State {
  
  enter (error) {
    console.log('进入失败状态:')
    console.log(error.message)
    this.error = error
    console.log('请重新输入KEY: ')
    process.stdin.on('data', chunk => {
      let key = chunk.toString().trim()
      this.setState(Checking, key)
    })
  }

  exit() {
    process.stdin.removeAllListeners()
  }
}

class Checking extends State {

  enter (key) {
    this.req = request
      .get('https://abel.nodetribe.com/provisioning/token')
      .query({ key })
      .then(res => {
        if (res.status !== 200) {
          return this.setState(Failed, res.error)
        }
        let token = res.body.token
        this.setState(Started, token)
      }, error => this.setState(Failed, error))
  }

  exit () {

  }
}

class Started extends State {
  
  enter (token) {
    process.stdout
    console.log('****系统就绪****')
    this.ctx.token = token
  }

  exit () {

  }
}


class AppService extends EventEmitter {

  constructor(config) {
    super()
    this.conf = config

    this.state = new Pending(this)
  }

  registByCsr (body, callback) {
    request
      .post('https://abel.nodetribe.com/provisioning/certificate/sign')
      .send(body)
      .then(res => {
        if (res.status !== 200) return callback(res.error)
        return callback(res.body)
      }, callback)
  }

}

module.exports = AppService