import path from 'path'
import fs from 'fs/promises'
import { homedir } from 'os'
import { createReadStream } from 'fs'
const { cwd, stdin, stdout } = process

const getUsername = (argsArr) => {
  const param = '--username='
  const username = argsArr.find(n => n.includes(param))
  if (!username) {
    return null
  }

  return username.slice(param.length)
}

const fileExists = async (file) => fs.access(file)
  .then(() => true)
  .catch(() => false)

const filename = () => {
  const username = getUsername(process.argv)
  let currentDir = homedir()

  const showPwd = () => console.log(`You are currently in ${currentDir}`)

  const operations = {
    '.exit': (isSigint) => {
      let exitText = `Thank you for using File Manager, ${username}!`
      // adds addition new line for sigint event so it looks prettier
      if (isSigint === true) {
        exitText = '\n' + exitText
      }
      console.log(exitText)
      process.exit()
    },
    up: async () => currentDir = path.resolve(currentDir, '..'),
    cd: async (args) => {
      const newDir = path.resolve(currentDir, args[0])
      if (!await fileExists(newDir)) {
        console.log('Operation failed')
        return
      }
      currentDir = newDir
    },
    ls: async () => {
      const files = await fs.readdir(currentDir)
      console.log(files)
    },
    cat: async (args) => {
      const file = args[0]
      const filePath = path.resolve(currentDir, file)
      if (!await fileExists(filePath)) {
        console.log('Operation failed')
        return
      }
      const rs = createReadStream(filePath)
      let data = ''
      rs.on('data', chunk => {
        data += chunk.toString().trim()
      })
      rs.on('end', () => { 
        console.log(data) 
        showPwd()
      })
    },
    add: async (args) => {
      const file = args[0]
      const filePath = path.resolve(currentDir, file)
      fs.writeFile(filePath, '')
    }
  }

  if (!username) {
    console.log('Enter correct username with --username=your_username')
    return
  }

  console.log(`Welcome to the File Manager, ${username}!`)
  showPwd()

  const doOperation = async (chunk) => {
    const input = chunk.toString().trim().split(' ')
    const command = input[0]
    const args = input.slice(1)
    if (!operations[command]) {
      console.log('Invalid input')
      return
    }
    await operations[command](args)
  }

  stdin.on('data', async (chunk) => {
    await doOperation(chunk)
    showPwd()
  })

  process.on('SIGINT', () => {
    operations['.exit'](true)
  })
}

filename()
