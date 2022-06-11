const fs = require('fs')
const { homedir } = require('os')
const { resolve } = require('path')
const { cwd, stdin, stdout } = require('process')
const { cursorTo } = require('readline')

const getUsername = (argsArr) => {
  const param = '--username='
  const username = argsArr.find(n => n.includes(param))
  if (!username) {
    return null
  }

  return username.slice(param.length)
}

const filename = () => {
  const username = getUsername(process.argv)
  let currentDir = homedir()

  const showPwd = () => console.log(`You are currently in ${currentDir}`)

  const operations = {
    '.exit': (isSigint) => {
      let exitText = `Thank you for using File Manager, ${username}!`
      // adds addition new line for sigint event so it looks prettier
      if (isSigint) {
        exitText = '\n' + exitText
      }
      console.log(exitText)
      process.exit()
    },
    up: () => {
      currentDir = resolve(currentDir, '..')
    }
  }

  if (!username) {
    console.log('Enter correct username with --username=your_username')
    return
  }

  console.log(`Welcome to the File Manager, ${username}!`)
  showPwd()

  const doOperation = chunk => {
    const command = chunk.toString().trim()
    if (!operations[command]) {
      console.log('Invalid input')
      return
    }
    try {
      operations[command]()
    } catch {
      console.log('Operation failed')
    }
  }

  stdin.on('data', chunk => {
    doOperation(chunk)
    showPwd()
  })

  process.on('SIGINT', () => {
    operations['.exit'](true)
  })
}

filename()
