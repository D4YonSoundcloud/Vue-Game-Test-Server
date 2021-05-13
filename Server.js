const express = require('express');
const app = express();
const cors = require('cors')
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
	cors: {
		origin: '*',
	}
});

let users = [];
let playerOneObject = {
	index: 0,
	state: 1,
	status: 'normal',
	attackTiles: [],
	tempTiles: [],
};
let playerTwoObject = {
	index: 99,
	state: 100,
	status: 'normal',
	attackTiles: [],
	tempTiles: [],
};
let boardGrid = [];

app.use(cors);

app.get('/', (req,res) => {
	res.send('<h1>This is where the data will be</h1>')
})

io.on('connection', (socket) => {
	socket.emit('userJoined', {
		users: users.map(s => s.username)
	})

	socket.on('newUser', username => {
		console.log('new user called!', username)
		socket.username = username;
		users.push(socket)
		while(users.length > 2) {
			users.shift();
			console.log(users.map(s => s.username));
		}
		io.emit('userOnline', {
			users: users.map(s => s.username)
		})
		io.emit('giveUserInformation', {
			playerOne: playerOneObject,
			playerTwo: playerTwoObject,
		})
	})

	socket.on('sendGridState', boardGridState => {
		console.log(boardGridState, 'this is from the state')

		boardGrid = boardGridState

		console.log(boardGrid, 'this is what we are sending');
		io.emit('giveGridState', {
			gridState: boardGrid,
		})
	})

	socket.on('sendChangePlayerStatus', statusChange => {
		if(statusChange.player === 1){
			playerOneObject.status = statusChange.status;
			playerOneObject.index = statusChange.index;
			console.log(playerOneObject.status)
			io.emit('giveUserInformation', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
			})
		} else if (statusChange.player === 100){
			playerTwoObject.status = statusChange.status;
			playerTwoObject.index = statusChange.index;
			io.emit('giveUserInformation', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
			})
		}
	})

	socket.on('sendUpdatePlayerIndex', indexChange => {
		if(indexChange.player === 1){
			playerOneObject.index = indexChange.index;
			console.log(playerOneObject.index, indexChange.index, 'player one')
			io.emit('giveUserInformation', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
			})
		} else if (indexChange.player === 100){
			playerTwoObject.index = indexChange.index;
			console.log(playerTwoObject.index, indexChange.index, 'player two')
			io.emit('giveUserInformation', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
			})
		}
	})

	console.log(' a user connected ! ')
})

server.listen(4000, () => {
	console.log('listening on *:3000')
})