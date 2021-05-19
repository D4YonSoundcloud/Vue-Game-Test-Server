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

let games = {}

app.use(cors);

app.get('/', (req,res) => {
	res.send('<h1>This is where the data will be</h1>')
})

io.on('connection', (socket) => {
	let query = socket.handshake.query;
	let roomId = query.roomId;

	socket.join(roomId)

	games[roomId] = {
		matchUsers: users,
		matchPlayerOne: playerOneObject,
		matchPlayerTwo: playerTwoObject,
		matchBoardGrid: boardGrid,
		matchRoomId: roomId
	}

	games['key 1'] = 'bruh';

	console.log(roomId, query)

	let matchUserNames = games[roomId].matchUsers.map(s => s.username)
	let matchIDs = games[roomId].matchUsers.map(s => s.playerId)

	socket.emit('userJoined', {
		users: matchUserNames,
		userIDs: matchIDs,
	})

	socket.on('newUser', username => {
		if(games[roomId].matchUsers.length === 2) return console.log('no more users can enter the match')

		console.log('new user called!', username.id, username.username)

		socket.username = username.username;
		socket.playerId = username.id;
		games[roomId].matchUsers.push(socket)

		let matchUserNames = games[roomId].matchUsers.map(s => s.username)
		let matchIDs = games[roomId].matchUsers.map(s => s.playerId)

		console.log(matchIDs, matchUserNames)

		if( username.id === matchIDs[0] ) {
			console.log('we are assigning the id and username')
			games[roomId].matchPlayerOne.id = username.id
			games[roomId].matchPlayerOne.username = username.username
			console.log('we have assigned them', games[roomId].matchPlayerOne.username)
		} else if ( username.id === matchIDs[1] ) {
			games[roomId].matchPlayerTwo.id = username.id
			games[roomId].matchPlayerTwo.username = username.username
		}

		let p1 = games[roomId].matchPlayerOne;
		let p2 = games[roomId].matchPlayerTwo;
		let grid = games[roomId].matchBoardGrid;

		// while(games[roomId].matchUsers.length > 2) {
		// 	games[roomId].matchUsers.shift();
		// 	console.log(games[roomId].matchUsers.map(s => s.username));
		// }

		console.log('about to emit')

		io.to(roomId).emit('userOnline', {
			users: matchUserNames,
			userIDs: matchIDs,
			boardState: grid,
		})

		io.to(roomId).emit('giveUserInformation', {
			playerOne: p1,
			playerTwo: p2,
			boardState: grid,
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
			games[roomId].playerOneObject.status = statusChange.status;
			games[roomId].playerOneObject.index = statusChange.index;
			console.log(games[roomId].playerOneObject.status, 1)
			io.to(roomId).emit('giveChangePlayerStatus', {
				playerOne: games[roomId].playerOneObject,
				playerTwo: games[roomId].playerTwoObject,
				boardState: games[roomId].boardGrid,
			})
		} else if (statusChange.player === 100){
			games[roomId].playerTwoObject.status = statusChange.status;
			games[roomId].playerTwoObject.index = statusChange.index;
			console.log(games[roomId].playerTwoObject.status, 100)
			io.to(roomId).emit('giveChangePlayerStatus', {
				playerOne: games[roomId].playerOneObject,
				playerTwo: games[roomId].playerTwoObject,
				boardState: games[roomId].boardGrid,
			})
		}
	})

	socket.on('sendUpdatePlayerIndex', indexChange => {
		if(indexChange.player === 1){
			console.log(games[roomId].playerOneObject.index, indexChange.index, indexChange.oldIndex, indexChange.oldValue, 'player one')
			games[roomId].playerOneObject.index = indexChange.index;
			games[roomId].boardGrid[indexChange.index] = indexChange.player;
			games[roomId].boardGrid[indexChange.oldIndex] = indexChange.oldValue;

			io.to(roomId).emit('giveUserInformation', {
				playerOne: games[roomId].playerOneObject,
				playerTwo: games[roomId].playerTwoObject,
				boardState: games[roomId].boardGrid,
			})
		} else if (indexChange.player === 100){
			console.log(games[roomId].playerTwoObject.index, indexChange.index, indexChange.oldIndex, indexChange.oldValue, 'player two')
			games[roomId].playerTwoObject.index = indexChange.index;
			games[roomId].boardGrid[indexChange.index] = indexChange.player;
			games[roomId].boardGrid[indexChange.oldIndex] = indexChange.oldValue;

			io.to(roomId).emit('giveUserInformation', {
				playerOne: games[roomId].playerOneObject,
				playerTwo: games[roomId].playerTwoObject,
				boardState: games[roomId].boardGrid,
			})
		}
	})

	socket.on('sendPlayerAttack', attack => {
		console.log(attack.boardState, attack.player)

		if(attack.player === 1) {
			games[roomId].boardGrid = attack.boardState
			io.to(roomId).emit('givePlayerAttack', {
				boardState: games[roomId].boardGrid
			})
		} else if (attack.player === 100) {
			games[roomId].boardGrid = attack.boardState
			io.to(roomId).emit('givePlayerAttack', {
				boardState: games[roomId].boardGrid
			})
		}
	})

	socket.on('sendPlayerLives', lives => {
		console.log(lives.player, lives.lives, 'changing the player lives')

		if(lives.player === 1) {
			games[roomId].playerOneObject.lives = lives.lives
			io.to(roomId).emit('givePlayerHealth', {
				playerOne: games[roomId].playerOneObject,
				playerTwo: games[roomId].playerTwoObject,
			})
		} else if (lives.player === 100) {
			playerTwoObject.lives = lives.lives
			io.to(roomId).emit('givePlayerHealth', {
				playerOne: games[roomId].playerOneObject,
				playerTwo: games[roomId].playerTwoObject,
			})
		}
	})

	console.log(' a user connected ! ')
})

server.listen(4000, () => {
	console.log('listening on *:3000')
})