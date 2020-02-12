(async () => {
	console.time('loadTime')
	const path = require('path')
	const express = require('express')
	const app = express()
	const http = require('http').Server(app)
	const io = require('socket.io')(http)
	process.env.root = __dirname

	const convert = await require('./server/convert.js')()
	await convert.loadAnimation({ id: 'standard', private: true })

	app.use(express.static(path.join(__dirname, 'public/')))
	app.get('/', (req, res) => {
		res.sendFile(path.join(__dirname, 'public/index.html'))
	})

	io.on('connection', (socket) => {
		socket.on('loadAnimation', async ({ id, frames, interval }) => {
			const animation = await convert.loadAnimation({ id, frames, interval })
			socket.emit('displayAnimation', animation)
		})

		socket.on('saveAnimation', async (animation) => {
			const message = await convert.frameDB.saveAnimation(animation)
			socket.emit('message', message)
		})

		socket.on('reqAnimationNames', async () => {
			const names = await convert.frameDB.getAllAnimationNames()
			socket.emit('resAnimationNames', names)
		})

		socket.on('writeTime', async () => {
			await convert.writeTime()
			socket.emit('message', 'Started clock')
		})
	})

	const port = process.env.NODE_ENV == 'production' ? 80 : 8080
	http.listen(port, () => {
		console.timeEnd('loadTime')
		console.log(`http://localhost:${port}`)
	})
})()
