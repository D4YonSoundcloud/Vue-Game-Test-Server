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

let games = {}

const PORT = process.env.PORT || 4000;
const INDEX = '/index.html';

app.use(cors);
app.use((req, res) => res.sendFile(INDEX, { root: __dirname }))
// app.get('/', (req,res) => {
// 	res.send('<h1>This is where the data will be</h1>')
// })

io.on('connection', (socket) => {
	let query = socket.handshake.query;
	let roomId = query.roomId;

	socket.join(roomId)

	if(!games[roomId]) {
		console.log('room not in game')

		games[roomId] = {
			matchUserNames: [],
			matchIDs: [],
			matchPlayerOne: {
				id: '',
				username: '',
				index: 0,
				state: 1,
				status: 'normal',
				attackTiles: [],
				tempTiles: [],
				lives: 50,
			},
			matchPlayerTwo: {
				id: '',
				username: '',
				index: 99,
				state: 100,
				status: 'normal',
				attackTiles: [],
				tempTiles: [],
				lives: 50,
			},
			matchBoardGrid: [
				0,0,0,0,0,0,0,0,0,0,
				0,0,25,0,0,0,0,25,0,0,
				0,25,0,0,0,0,0,0,25,0,
				0,0,0,0,0,0,0,0,0,0,
				0,0,0,0,0,0,0,0,0,0,
				0,0,0,0,0,0,0,0,0,0,
				0,0,0,0,0,0,0,0,0,0,
				0,25,0,0,0,0,0,0,25,0,
				0,0,25,0,0,0,0,25,0,0,
				0,0,0,0,0,0,0,0,0,0,
			],
			matchRoomId: roomId,
			matchCurrentNumberOfUsers: 0,
			matchRematchCount: 0,
		}
	} else {
		console.log('room is already in game')
	}


	games['key 1'] = 'bruh';

	console.log(roomId, query)

	/**
	 * Emit to the socket so that the user gets the users and userIDs when the join the lobby
	 */
	socket.emit('userJoined', {
		users: games[roomId].matchUserNames,
		userIDs: games[roomId].matchIDs,
	})

	/**
	 * Handles a new user joining
	 */
	socket.on('newUser', username => {
		if(games[roomId].matchIDs.length === 2) return console.log('no more users can enter the match')

		games[roomId].matchCurrentNumberOfUsers++;

		console.log('new user called!', username.id, username.username, games[roomId].matchCurrentNumberOfUsers)

		socket.username = username.username;
		socket.playerId = username.id;
		games[roomId].matchUserNames.push(username.username)
		games[roomId].matchIDs.push(username.id)

		console.log(games[roomId].matchUserNames, games[roomId].matchIDs)

		if( username.id === games[roomId].matchIDs[0] ) {
			console.log('we are assigning the id and username')
			games[roomId].matchPlayerOne.id = username.id
			games[roomId].matchPlayerOne.username = username.username
			console.log('we have assigned them', games[roomId].matchPlayerOne.username)
		} else if ( username.id === games[roomId].matchIDs[1] ) {
			games[roomId].matchPlayerTwo.id = username.id
			games[roomId].matchPlayerTwo.username = username.username
		}

		console.log('about to emit')

		io.to(roomId).emit('userOnline', {
			users: games[roomId].matchUserNames,
			userIDs: games[roomId].matchIDs,
			boardState: games[roomId].matchBoardGrid,
		})

		io.to(roomId).emit('giveUserInformation', {
			playerOne: games[roomId].matchPlayerOne,
			playerTwo: games[roomId].matchPlayerTwo,
			boardState: games[roomId].matchBoardGrid,
		})
	})

	/**
	 * Updates the player status
	 */
	socket.on('sendChangePlayerStatus', statusChange => {
		if(statusChange.player === 1){
			games[roomId].matchPlayerOne.status = statusChange.status;
			games[roomId].matchPlayerOne.index = statusChange.index;
			console.log(games[roomId].matchPlayerOne.status, 1)
			io.to(roomId).emit('giveChangePlayerStatus', {
				playerOne: games[roomId].matchPlayerOne,
				playerTwo: games[roomId].matchPlayerTwo,
				boardState: games[roomId].matchBoardGrid,
			})
		} else if (statusChange.player === 100){
			games[roomId].matchPlayerTwo.status = statusChange.status;
			games[roomId].matchPlayerTwo.index = statusChange.index;
			console.log(games[roomId].matchPlayerTwo.status, 100)
			io.to(roomId).emit('giveChangePlayerStatus', {
				playerOne: games[roomId].matchPlayerOne,
				playerTwo: games[roomId].matchPlayerTwo,
				boardState: games[roomId].matchBoardGrid,
			})
		}
	})

	/**
	 * Updates the player index + board
	 */
	socket.on('sendUpdatePlayerIndex', indexChange => {
		if(indexChange.player === 1){
			console.log(games[roomId].matchPlayerOne.index, indexChange.index, indexChange.oldIndex, indexChange.oldValue, 'player one')
			games[roomId].matchPlayerOne.index = indexChange.index;
			games[roomId].matchBoardGrid[indexChange.index] = indexChange.player;
			games[roomId].matchBoardGrid[indexChange.oldIndex] = indexChange.oldValue;

			io.to(roomId).emit('giveUserInformation', {
				playerOne: games[roomId].matchPlayerOne,
				playerTwo: games[roomId].matchPlayerTwo,
				boardState: games[roomId].matchBoardGrid,
			})
		} else if (indexChange.player === 100){
			console.log(games[roomId].matchPlayerTwo.index, indexChange.index, indexChange.oldIndex, indexChange.oldValue, 'player two')
			games[roomId].matchPlayerTwo.index = indexChange.index;
			games[roomId].matchBoardGrid[indexChange.index] = indexChange.player;
			games[roomId].matchBoardGrid[indexChange.oldIndex] = indexChange.oldValue;

			io.to(roomId).emit('giveUserInformation', {
				playerOne: games[roomId].matchPlayerOne,
				playerTwo: games[roomId].matchPlayerTwo,
				boardState: games[roomId].matchBoardGrid,
			})
		}
	})

	/**
	 * Handles the player attacks
	 */
	socket.on('sendPlayerAttack', attack => {
		console.log(attack.boardState, attack.player)

		if(attack.player === 1) {
			games[roomId].matchBoardGrid = attack.boardState
			io.to(roomId).emit('givePlayerAttack', {
				boardState: games[roomId].matchBoardGrid
			})
		} else if (attack.player === 100) {
			games[roomId].matchBoardGrid = attack.boardState
			io.to(roomId).emit('givePlayerAttack', {
				boardState: games[roomId].matchBoardGrid
			})
		}
	})

	/**
	 * Handles the player Lives
	 */
	socket.on('sendPlayerLives', lives => {
		console.log(lives.player, lives.lives, 'changing the player lives')

		if(lives.player === 1) {
			games[roomId].matchPlayerOne.lives = lives.lives
			io.to(roomId).emit('givePlayerHealth', {
				playerOne: games[roomId].matchPlayerOne,
				playerTwo: games[roomId].matchPlayerTwo,
			})
		} else if (lives.player === 100) {
			games[roomId].matchPlayerTwo.lives = lives.lives
			io.to(roomId).emit('givePlayerHealth', {
				playerOne: games[roomId].matchPlayerOne,
				playerTwo: games[roomId].matchPlayerTwo,
			})
		}
	})

	/**
	 * Handles when a socket disconnects
	 */
	socket.on('disconnectFromRoom', player => {
		console.log(player)

		if(player === 1){
			console.log(games[roomId].matchIDs.length)
			if(games[roomId].matchIDs.length === 1){
				delete games[roomId]
				console.log(games);
			} else {
				games[roomId].matchUserNames.shift();
				games[roomId].matchIDs.shift();
				games[roomId].matchPlayerOne = {
					id: '',
					username: '',
					index: 0,
					state: 1,
					status: 'normal',
					attackTiles: [],
					tempTiles: [],
					lives: 50,
				}

				io.to(roomId).emit('giveUserInformation', {
					playerOne: games[roomId].matchPlayerOne,
					playerTwo: games[roomId].matchPlayerTwo,
					boardState: games[roomId].matchBoardGrid,
				})
			}

		} else if (player === 100) {

			if(games[roomId].matchIDs.length === 1){
				delete games[roomId]
				console.log(games);
			} else {
				games[roomId].matchUserNames.pop();
				games[roomId].matchIDs.pop();
				games[roomId].matchPlayerTwo = {
					id: '',
					username: '',
					index: 99,
					state: 100,
					status: 'normal',
					attackTiles: [],
					tempTiles: [],
					lives: 50,
				}

				io.to(roomId).emit('giveUserInformation', {
					playerOne: games[roomId].matchPlayerOne,
					playerTwo: games[roomId].matchPlayerTwo,
					boardState: games[roomId].matchBoardGrid,
				})
			}

		}
	})

	socket.on('disconnect', () => {
		console.log('the user has disconnected', roomId)
		if(!games[roomId]) return console.log('there is no room of that id')
		if(games[roomId].matchCurrentNumberOfUsers === 1){
			console.log('we are about to delete the room')
			delete games[roomId]
			console.log(games)
		} else {
			games[roomId].matchCurrentNumberOfUsers--;
			console.log(games[roomId].matchCurrentNumberOfUsers)
		}
	})

	socket.on('sendAddToRematch', rematch => {
		if(games[roomId].matchRematchCount === 1){
			games[roomId] = {
				matchUserNames: [],
				matchIDs: [],
				matchPlayerOne: {
					id: '',
					username: '',
					index: 0,
					state: 1,
					status: 'normal',
					attackTiles: [],
					tempTiles: [],
					lives: 50,
				},
				matchPlayerTwo: {
					id: '',
					username: '',
					index: 99,
					state: 100,
					status: 'normal',
					attackTiles: [],
					tempTiles: [],
					lives: 50,
				},
				matchBoardGrid: [
					0,0,0,0,0,0,0,0,0,0,
					0,0,25,0,0,0,0,25,0,0,
					0,25,0,0,0,0,0,0,25,0,
					0,0,0,0,0,0,0,0,0,0,
					0,0,0,0,0,0,0,0,0,0,
					0,0,0,0,0,0,0,0,0,0,
					0,0,0,0,0,0,0,0,0,0,
					0,25,0,0,0,0,0,0,25,0,
					0,0,25,0,0,0,0,25,0,0,
					0,0,0,0,0,0,0,0,0,0,
				],
				matchRoomId: roomId,
				matchCurrentNumberOfUsers: 0,
				matchRematchCount: 0,
			}
			io.to(roomId).emit('giveUserInformation', {
				playerOne: games[roomId].matchPlayerOne,
				playerTwo: games[roomId].matchPlayerTwo,
				boardState: games[roomId].matchBoardGrid,
			})
		} else {
			games[roomId].matchRematchCount++;
			io.to(roomId).emit('givePlayerRematchCount', {
				rematchCount: games[roomId].matchRematchCount,
			})
		}
	})

	console.log(' a user connected ! ')
})

server.listen(PORT, () => {
	console.log('listening on *:4000')
})

