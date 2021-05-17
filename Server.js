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
let boardGrid = [
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
];

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
			boardState: boardGrid,
		})
	})

	socket.on('sendGridState', boardGridState => {
		console.log(boardGridState.grid, 'this is from the state', boardGridState.username)

		boardGrid = boardGridState.grid

		console.log(boardGrid, 'this is what we are sending', boardGridState.username);
		socket.broadcast.emit('giveGridState', {
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
				boardState: boardGrid,
			})
		} else if (statusChange.player === 100){
			playerTwoObject.status = statusChange.status;
			playerTwoObject.index = statusChange.index;
			io.emit('giveUserInformation', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
				boardState: boardGrid,
			})
		}
	})

	socket.on('sendUpdatePlayerIndex', indexChange => {
		if(indexChange.player === 1){
			console.log(playerOneObject.index, indexChange.index, indexChange.oldIndex, indexChange.oldValue, 'player one')
			playerOneObject.index = indexChange.index;
			boardGrid[indexChange.index] = indexChange.player;
			boardGrid[indexChange.oldIndex] = indexChange.oldValue;

			io.emit('giveUserInformation', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
				boardState: boardGrid,
			})
		} else if (indexChange.player === 100){
			console.log(playerTwoObject.index, indexChange.index, indexChange.oldIndex, indexChange.oldValue, 'player two')
			playerTwoObject.index = indexChange.index;
			boardGrid[indexChange.index] = indexChange.player;
			boardGrid[indexChange.oldIndex] = indexChange.oldValue;

			io.emit('giveUserInformation', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
				boardState: boardGrid,
			})
		}
	})

	console.log(' a user connected ! ')
})

server.listen(4000, () => {
	console.log('listening on *:3000')
})