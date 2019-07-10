const path = require('path')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const jsonfile = require('jsonfile')
const exec = require('child_process').exec

const begin = Date.now()
const Ypix = 48
const Xpix = 48

app.use(express.static(path.join(__dirname, 'public/')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'))
})

function serializeFrame(frame, log = false) {
  let arr = [];
  for (let column = 0; column < 8; column++) {
    for (let panel = Ypix / 8 - 1; panel >= 0; panel--) {
      if (panel % 2 == 1) {
        for (let block = 0; block < 6; block++) {
          for (let y = 0; y < 8; y++) {
            let x = (7 - column) + (block * 8);
            arr.push(frame[y + (panel * 8)][x]);
          }
        }
      } else {
        for (let block = 0; block < 6; block++) {
          for (let y = 7; y >= 0; y--) {
            let x = Xpix - 1 - (7 - column) - (block * 8);
            arr.push(frame[y + (panel * 8)][x]);
          }
        }
      }
      for (let i = 0; i < 8; i++) {
        if (i == column) arr.push(0);
        else arr.push(1);
      }
    }
  }

  // this replaces the array of bits with an array of bytes
  // so [1,0,0,1,1,1,0,1,1,0,0,1,1,1,0,1](16 bits) becomes [200,145](two bytes in base 10 format because js doesnt want to store bits)
  let newArr = [];
  for (let i = 0; i < arr.length; i += 8) {
    let byte = '';
    for (let bit = 0; bit < 8; bit++) {
      byte += String(arr[bit + i]);
    }
    byte = parseInt(byte, 2);
    newArr.push(byte);
  }
  arr = newArr;

  if (log) console.log(JSON.stringify(arr));
  return arr;
}

function serializeFrames(frames) {
  let newFrames = []
  frames.forEach(frame => {
    newFrames.push(serializeFrame(frame))
  })
  return newFrames
}


let pos = 0
let globalFrames = [[0, 0, 0, 0, 0, 0, 127, 0, 0, 0, 0, 0, 0, 127, 0, 96, 4, 8, 0, 0, 127, 0, 0, 127, 0, 0, 0, 127, 0, 24, 128, 48, 0, 0, 127, 0, 0, 0, 0, 0, 0, 127, 0, 0, 0, 0, 0, 0, 191, 0, 0, 0, 0, 0, 0, 191, 0, 192, 4, 8, 0, 0, 191, 0, 0, 0, 0, 0, 0, 191, 0, 6, 0, 32, 0, 0, 191, 0, 0, 0, 0, 0, 0, 191, 0, 0, 0, 0, 0, 0, 223, 0, 0, 0, 0, 0, 0, 223, 0, 128, 8, 8, 0, 0, 223, 0, 0, 0, 0, 0, 0, 223, 0, 3, 64, 64, 0, 0, 223, 0, 0, 0, 0, 0, 0, 223, 0, 0, 0, 0, 0, 0, 239, 0, 0, 0, 0, 0, 0, 239, 0, 0, 8, 4, 0, 0, 239, 0, 255, 255, 0, 0, 0, 239, 0, 0, 67, 67, 0, 0, 239, 0, 0, 0, 0, 0, 0, 239, 0, 0, 0, 0, 0, 0, 247, 0, 0, 0, 0, 0, 0, 247, 0, 0, 8, 4, 128, 0, 247, 0, 0, 0, 63, 127, 0, 247, 0, 0, 192, 64, 1, 0, 247, 0, 0, 0, 128, 0, 0, 247, 0, 0, 0, 0, 0, 0, 251, 0, 0, 0, 0, 0, 0, 251, 0, 0, 8, 0, 64, 0, 251, 0, 0, 0, 0, 192, 0, 251, 0, 0, 192, 128, 3, 0, 251, 0, 0, 0, 128, 0, 0, 251, 0, 0, 0, 0, 0, 0, 253, 0, 0, 0, 0, 0, 0, 253, 0, 0, 16, 4, 48, 0, 253, 0, 0, 0, 0, 0, 0, 253, 0, 0, 96, 128, 12, 0, 253, 0, 0, 0, 128, 0, 0, 253, 0, 0, 0, 0, 0, 0, 254, 0, 0, 0, 0, 0, 0, 254, 0, 0, 32, 0, 16, 0, 254, 0, 0, 0, 0, 0, 0, 254, 0, 0, 48, 131, 24, 0, 254, 0, 0, 0, 0, 0, 0, 254]]
let globalInterval = 1000
let timeOut
let uploading

async function upload(frames, interval) {
  // console.log(Date.now() - begin, 'upload')
  if (timeOut) clearTimeout(timeOut)
  if (frames) {
    pos = 0
    globalFrames = serializeFrames(frames)
    globalInterval = frames.length <= 1 ? 1 : interval
  }
  if (uploading) return

  let command = `python3 server/convert.py ${globalFrames[pos]} ${Ypix}`
  // console.log(command)
  // console.log('uploading frame', pos)
  const uploadStart = Date.now() - begin
  console.log(uploadStart, 'upload start')
  console.log(command)
  uploading = await exec(command, { async: true })
  const uploadEnd = Date.now() - begin
  console.log(uploadEnd, 'upload end in ', uploadEnd - uploadStart)
  uploading = null
  if (globalFrames.length <= 1) {
    // console.log(Date.now() - begin, 'done')
    return
  }
  // console.log(Date.now() - begin, 'started timeOut with', globalInterval, 'ms')
  // timeOut = setTimeout(() => {
  //   // console.log(Date.now() - begin, 'run timeout callback')
  //   pos++
  //   if (pos == globalFrames.length) pos = 0
  //   upload()
  // }, globalInterval)
}


io.on('connection', (socket) => {
  socket.on('frames', ({ frames, interval }) => {
    upload(frames, interval)
  })


  // exec('make upload', { cwd: path.join(__dirname) }, (err, stdout, stderr) => {
  //   if (err) console.error(err)
  //   else {
  //     console.log(`stderr: ${stderr}`)
  //     console.log('Sketch uploaded')
  //     // console.log(`stdout: ${stdout}`)
  //   }
  // })


  socket.on('saveAnimation', ({ arr, name }) => {
    name = name.replace(/\./g, '')
    name += '(' + (new Date()).toLocaleDateString('en-GB').replace(/\//g, '-') + ')'

    let file = path.join(__dirname, 'server/animations', name + '.json')
    jsonfile.writeFile(file, arr, (err) => {
      if (err) console.error(err)
      else console.log('Animation saved')
    })
  })
})

process.on('exit', () => {
  uploading.kill()
})

http.listen(8080, () => { })
