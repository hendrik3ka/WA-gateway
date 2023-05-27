import makeWASocket, { Browsers, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { phoneNumberFormatter } from './formatter'
import { Boom } from '@hapi/boom'
import { Request, RequestHandler, Response } from 'express'
import { socket } from "./server";
import qrcode from 'qrcode'

const session = new Map()
const VAR = 'VAR_SESSION'
let connectionStatus: string = 'Checking connection'
let qrCode: string;

export const initWhatsApp = async() => {
	await connectToWhatsApp()
}
export const getStatus: RequestHandler = async(req: Request, res: Response) => {
	if(qrCode == null || qrCode == undefined) {
		res.json({
			success: true,
			data: connectionStatus,
			message: 'Welcome'
		})
	} else {
        socket.emit('qr', { src: qrCode });
	}
}

export const sendMessage: RequestHandler = async(req: Request, res: Response) => {
    const {whatsapp, message} = req.body;
    // check if whatsapp number and message exists
    if(!whatsapp || !message) {
        res.status(200).json({
            success: false,
            message: 'Whatsapp number and message are required'
        });
    }
    const number = phoneNumberFormatter(whatsapp);
    if(connectionStatus === 'connected'){
        const sendMsg = await session.get(VAR).sendMessage(number, { text: `${message}` });
        if(sendMsg){
            res.status(200).json({
                success: true,
                message: 'Your message has been sent'
            });
        } else {
            // you can also return the status with code 500 (Error 500 Internal Server), ex: res.status(500).json()
            res.status(200).json({
                success: false,
                message: 'Something wrong happened'
            });
        }
    } else {
        res.status(200).json({
            success: false,
            message: 'You are not connected to WhatsApp Bot yet!'
        });
    }
}
async function connectToWhatsApp () {
    // you can put the auth files in the unique sub folder for multi sessions / devices, ex: sessions/phone_number/the_session
    // in this example I only use session folder
	const {state, saveCreds} = await useMultiFileAuthState('session')
    const sock = makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,
        browser: Browsers.macOS('Desktop'),
		auth: state
    })
	sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
		// if QR Code changes
		if(update.qr){
            try {
                const qrCode = await qrcode.toDataURL(update.qr)
                socket.emit('qr', { src: qrCode });
                console.log("Ready scan now!")
            } catch {
                console.log('Unable to create QR code.')
            }
		}
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
			connectionStatus = 'Closed'
            socket.emit('close', {
                meesage: 'Connection closed due to ' + lastDisconnect?.error + ', reconnecting'
            })
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
			connectionStatus = 'connected'
            socket.emit('authenticated', {
                data: sock.user
            })
            console.log('Connected')
        }
    })

    // function to receive incoming messages
    // You can also add auto reply here
    sock.ev.on('messages.upsert', async m => {
        console.log(JSON.stringify(m, undefined, 2))
        console.log('replying to', m.messages[0].key.remoteJid)
    })
    // save the sock into session
	session.set(VAR, sock)
}
// export the session
export { session }