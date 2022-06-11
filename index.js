const fs = require('fs')
const { cwd, stdin, stdout } = require('process')

const getUsername = () => {
  const param = '--username='
  const username = process.argv.find(n => n.includes(param))
  if (!username) {
    return null
  }

  return username.slice(param.length)
}

const filename = () => {
  const username = getUsername()

  const operations = {
    '.exit': (isSigint) => {
      let exitText = `Bye, ${username}!`
      // adds addition new line for sigint event so it looks prettier
      if (isSigint) {
        exitText = '\n' + exitText
      }
      console.log(exitText)
      process.exit()
    }
  }

  if (!username) {
    console.log('Enter correct username with --username=your_username')
    return
  }

  stdin.on('data', chunk => {
    const command = chunk.toString().trim()
    if (operations[command]) {
      operations[command]()
    }
  })

  process.on('SIGINT', () => {
    operations['.exit'](true)
  })
}

filename()
