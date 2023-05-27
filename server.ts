import express from 'express'
import { Server } from 'socket.io'
import fs from 'fs'
import "dotenv/config";
import {initWhatsApp,getStatus,sendMessage,session} from './wa'

const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 3000

const app = express()
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); // Adjust the origin as needed
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});
app.use(express.json());


app.get('/', getStatus);

app.post('/send-message', sendMessage);

const logoutDevice = () => {
    const sock = session.get('VAR_SESSION')
    sock.logout();
    if (fs.existsSync(`./session`)) {
        fs.rmSync(`./session`, { force: true, recursive: true });
    }
    session.delete('VAR_SESSION')
}

const server = app.listen(port, async () => {
	console.log(`listening to port ${port}`);
})

const io = new Server(server);

const socket = io.on("connection", (socket) => {
    const sock = session.get('VAR_SESSION');
	socket.on('create-session', async function (data) {
        if (session.has('VAR_SESSION')) {
			socket.emit('authenticated', {
                data: sock.user
            })
        } else {
			console.log('Create session...');
            // you can store your whatsapp number here, ex: await initWhatsApp(data.numberId) to create multi sessions / devices
        	await initWhatsApp()
        }
    });
    socket.on('logout', async function () {
        if (fs.existsSync(`./session`)) {
            socket.emit('isdelete', {
                message: 'Logout Success, Lets Scan Again'
            })
            logoutDevice();
        } else {
            socket.emit('isdelete', {
                message: 'You are have not Login yet!'
            })
        }
    })
	socket.on("disconnect", () => {
		console.log("Socket Disconnect");
	});
    socket.on("send-message", async function(data){
        console.log(data)
    });
	return socket;
});

export { socket, io };
