import path from 'path'
import fs from 'fs/promises'
import os from 'os'
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
      if (!args[0]) {
        console.log('Operation failed')
        return
      }
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
      if (!file) {
        console.log('Operation failed')
        return
      }
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
      if (!file) {
        console.log('Operation failed')
        return
      }
      const filePath = path.resolve(currentDir, file)
      if (await fileExists(filePath)) {
        console.log('Operation failed')
        return
      }
      await fs.writeFile(filePath, '')
    },
    rn: async (args) => {
      const oldName = args[0]
      const newName = args[1]
      if (!await fileExists(path.resolve(currentDir, oldName)) ||
          !oldName) {
        console.log('Operation failed')
        return
      }
      fs.rename(
        path.resolve(currentDir, oldName),
        path.resolve(currentDir, newName)
      )
    },
    cp: async (args) => {
      if (!args[0] || !args[1]) {
        console.log('Operation failed')
        return
      }
      const srcFile = path.resolve(currentDir, args[0])
      const destFile = path.resolve(currentDir, args[1])
      if (!await fileExists(path.resolve(srcFile))) {
        console.log('Operation failed')
        return
      }
      await fs.cp(srcFile, destFile, { recursive: true })
    },
    rm: async (args) => {
      if (!args[0]) {
        console.log('Operation failed')
        return
      }
      const file = path.resolve(currentDir, args[0])
      if (!await fileExists(file)) {
        console.log('Operation failed')
        return
      }
      await fs.rm(file, { recursive: true })
    },
    mv: async (args) => {
      operations.rn(args)
    },
    os: {
      '--EOL': () => {
        console.log(JSON.stringify(os.EOL))
      }
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
    if (typeof operations[command] === 'string') {
      await operations[command](args)
    } else if (typeof operations[command] === 'object') {
      await operations[command][args[0]]()
    }
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
