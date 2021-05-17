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
	lives: 3,
};
let playerTwoObject = {
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
			console.log(playerOneObject.status, 1)
			io.emit('giveChangePlayerStatus', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
				boardState: boardGrid,
			})
		} else if (statusChange.player === 100){
			playerTwoObject.status = statusChange.status;
			playerTwoObject.index = statusChange.index;
			console.log(playerTwoObject.status, 100)
			io.emit('giveChangePlayerStatus', {
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

	socket.on('sendPlayerAttack', attack => {
		console.log(attack.boardState, attack.player)

		if(attack.player === 1) {
			boardGrid = attack.boardState
			io.emit('givePlayerAttack', {
				boardState: boardGrid
			})
		} else if (attack.player === 100) {
			boardGrid = attack.boardState
			io.emit('givePlayerAttack', {
				boardState: boardGrid
			})
		}
	})

	socket.on('sendPlayerLives', lives => {
		console.log(lives.player, lives.lives, 'changing the player lives')

		if(lives.player === 1) {
			playerOneObject.lives = lives.lives
			io.emit('givePlayerHealth', {
				playerOne: playerOneObject,
				playerTwo: playerTwoObject,
			})
		} else if (lives.player === 100) {
			playerTwoObject.lives = lives.lives
			io.emit('givePlayerHealth', {
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