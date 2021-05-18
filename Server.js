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
	id: '',
	username: '',
	index: 0,
	state: 1,
	status: 'normal',
	attackTiles: [],
	tempTiles: [],
	lives: 3,
};
let playerTwoObject = {
	id: '',
	username: '',
	index: 99,
	state: 100,
	status: 'normal',
	attackTiles: [],
	tempTiles: [],
	lives: 3,
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
	let query = socket.handshake.query;
	let roomId = query.roomId;

	console.log(roomId, query)

	socket.join(roomId)

	socket.emit('userJoined', {
		users: users.map(s => s.username),
		userIDs: users.map(s => s.playerId)
	})

	socket.on('newUser', username => {
		if(users.length === 2){
			return console.log('no more users can enter the match')
		}

		console.log('new user called!', username.id, username.username)
		socket.username = username.username;
		socket.playerId = username.id;
		users.push(socket)

		while(users.length > 2) {
			users.shift();
			console.log(users.map(s => s.username));
		}
		io.to(roomId).emit('userOnline', {
			users: users.map(s => s.username),
			userIDs: users.map(s => s.playerId),
		})
		io.to(roomId).emit('giveUserInformation', {
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
			console.log(playerOneObject.status, 1)
			io.to(roomId).emit('giveChangePlayerStatus', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
				boardState: boardGrid,
			})
		} else if (statusChange.player === 100){
			playerTwoObject.status = statusChange.status;
			playerTwoObject.index = statusChange.index;
			console.log(playerTwoObject.status, 100)
			io.to(roomId).emit('giveChangePlayerStatus', {
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

			io.to(roomId).emit('giveUserInformation', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
				boardState: boardGrid,
			})
		} else if (indexChange.player === 100){
			console.log(playerTwoObject.index, indexChange.index, indexChange.oldIndex, indexChange.oldValue, 'player two')
			playerTwoObject.index = indexChange.index;
			boardGrid[indexChange.index] = indexChange.player;
			boardGrid[indexChange.oldIndex] = indexChange.oldValue;

			io.to(roomId).emit('giveUserInformation', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
				boardState: boardGrid,
			})
		}
	})

	socket.on('sendPlayerAttack', attack => {
		console.log(attack.boardState, attack.player)

		if(attack.player === 1) {
			boardGrid = attack.boardState
			io.to(roomId).emit('givePlayerAttack', {
				boardState: boardGrid
			})
		} else if (attack.player === 100) {
			boardGrid = attack.boardState
			io.to(roomId).emit('givePlayerAttack', {
				boardState: boardGrid
			})
		}
	})

	socket.on('sendPlayerLives', lives => {
		console.log(lives.player, lives.lives, 'changing the player lives')

		if(lives.player === 1) {
			playerOneObject.lives = lives.lives
			io.to(roomId).emit('givePlayerHealth', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
			})
		} else if (lives.player === 100) {
			playerTwoObject.lives = lives.lives
			io.to(roomId).emit('givePlayerHealth', {
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