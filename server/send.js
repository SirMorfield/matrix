const Gpio = require('onoff').Gpio
const resetPin = new Gpio(21, 'out')
const i2c = require('i2c-bus')
const arduinoAddress = 0x04

async function writeByte(byte) {
	try {
		await Arduino.i2cWrite(arduinoAddress, 1, Buffer.from([byte]))
	} catch (err) { return { error: err } }
}

async function write(value) {
	return new Promise((resolve) => {
		resetPin.write(value, (err) => {
			if (err) resolve({ error: err })
			resolve()
		})
	})
}

let i2cArduino
async function sendToArduino(bytes) {
	if (!Arduino) i2cArduino = await i2c.openPromisified(1)

	await write(1)
	await new Promise((resolve) => setTimeout(resolve, 0.001))
	await write(0)
	await new Promise((resolve) => setTimeout(resolve, 0.001))

	for (const byte of bytes) {
		await writeByte(byte)
	}
}

module.exports = sendToArduino