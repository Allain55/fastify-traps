'use strict'

const { test } = require('tap')
const { fork } = require('child_process')
const { join } = require('path')
const Fastify = require('fastify')
const plugin = require('../')

test('invalid options', async t => {
  const list = [
    {
      opts: {
        onSignal: null
      },
      error: new TypeError('onSignal must be a function, received object')
    },
    {
      opts: {
        onClose: null
      },
      error: new TypeError('onClose must be a function, received object')
    },
    {
      opts: {
        onTimeout: null
      },
      error: new TypeError('onTimeout must be a function, received object')
    },
    {
      opts: {
        onError: null
      },
      error: new TypeError('onError must be a function, received object')
    },
    {
      opts: {
        timeout: '7'
      },
      error: new TypeError('timeout must be a number, received string')
    },
    {
      opts: {
        timeout: 0
      },
      error: new RangeError('timeout must be greather than 0, received 0')
    },
    {
      opts: {
        strict: 'true'
      },
      error: new TypeError('strict must be a boolean, received string')
    }
  ]

  for (const [index, item] of list.entries()) {
    const fastify = Fastify()
    const opts = Object.assign({}, item.opts, item.opts.strict ? {} : { strict: false })
    await t.rejects(() => fastify.register(plugin, opts), item.error, `item ${index}`)
  }
  t.end()
})

test('valid options', async t => {
  const list = [
    {
      opts: {
        onSignal: () => {}
      }
    },
    {
      opts: {
        onClose: () => {}
      }
    },
    {
      opts: {
        onTimeout: () => {}
      }
    },
    {
      opts: {
        onError: () => {}
      }
    },
    {
      opts: {
        timeout: 7
      }
    }
  ]

  for (const [index, item] of list.entries()) {
    const fastify = Fastify()
    const opts = Object.assign({}, item.opts, { strict: false })
    await t.resolves(() => fastify.register(plugin, opts), `item ${index}`)
  }
  t.end()
})
test('close', { only: true }, t => {
  t.plan(10)
  function testSignal (signal) {
    const server = fork(join(__dirname, 'fixtures/close.js'), {
      stdio: 'pipe'
    })

    let stdout = ''
    let errored = false

    server.on('message', payload => {
      switch (payload) {
        case 'error':
          errored = true
          break
        case 'listening':
          server.kill(signal)
          break
      }
    })

    server.stdout.on('data', chunk => {
      stdout += chunk
    })

    server.on('exit', code => {
      t.false(errored)
      t.is(code, 0)
      const reg = new RegExp(`Received Signal: ${signal}`)
      t.true(reg.test(stdout))
      t.true(/Closing/.test(stdout))
      t.true(/Closed/.test(stdout))
    })
    server.on('error', t.error)
  }

  for (const signal of ['SIGINT', 'SIGTERM']) {
    testSignal(signal)
  }
})

test('close timeout', { todo: true }, t => {})
test('close error', { todo: true }, t => {})
