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

const swapLookUpTable = {
	'left': 1,
	'right': -1,
	'up': 10,
	'down': -10,
	'rightWall': 9,
	'leftWall': -9,
}

io.on('connection', (socket) => {
	let query = socket.handshake.query;
	let roomId = query.roomId;

	socket.join(roomId)

	if(Object.keys(games).length === 0) {
		games.tick = true;
	}

	/**
	 * function we run every 16ms (60hz tick rate)
	 */
	function serverPhysicsTick() {
		//loop through queued player status changes
		for(let statusChange of games[roomId].clientStatusChanges){
			handleStatusChange(statusChange)
		}

		//loop through queued player attack
		for(let playerAttack of games[roomId].clientPlayerAttacks){
			console.log(playerAttack.input, 'this is player attackInput', process.uptime())
			if(playerAttack.input === 'right' || playerAttack.input === 'left'){
				handleHorizontalPlayerAttack(playerAttack);
			} else {
				handleVerticalPlayerAttack(playerAttack);
			}
		}

		//loop through queued player inputs
		for(let playerInput of games[roomId].clientInputs){
			if(playerInput.input === 'right') {
				assignButtonPress(playerInput);
				movePlayerRight(playerInput);
				console.log('the input is right', games[roomId].matchPlayerOne.buttonPressed, games[roomId].matchPlayerTwo.buttonPressed)
			} else if (playerInput.input === 'left') {
				assignButtonPress(playerInput);
				movePlayerLeft(playerInput);
				console.log('the input is left', games[roomId].matchPlayerOne.buttonPressed, games[roomId].matchPlayerTwo.buttonPressed)
			} else if (playerInput.input === 'up') {
				console.log('the input is up')
				assignButtonPress(playerInput);
				movePlayerUp(playerInput);
			} else if (playerInput.input === 'down') {
				console.log('the input is down')
				assignButtonPress(playerInput);
				movePlayerDown(playerInput);
			}
		}

		if(games[roomId]){
			io.to(roomId).emit('givePlayerHealth', {
				playerOne: games[roomId].matchPlayerOne,
				playerTwo: games[roomId].matchPlayerTwo,
			})
		}
	}

	/**
	 * function we run every 33ms (30hz tick rate)
	 */
	function serverUpdateTick() {
		io.to(roomId).emit('giveServerUpdate', {
			matchPlayerOne: games[roomId].matchPlayerOne,
			matchPlayerTwo: games[roomId].matchPlayerTwo,
			matchBoard: games[roomId].matchBoardGrid,
			matchUserName: games[roomId].matchUserNames,
			matchIDs: games[roomId].matchIDs,
		})
	}

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
				buttonPressed: 'down',
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
				buttonPressed: 'up',
			},
			matchBoardGrid: [
				1,0,0,0,0,0,0,0,0,0,
				0,0,25,0,0,0,0,25,0,0,
				0,25,0,0,0,0,0,0,25,0,
				0,0,0,0,0,0,0,0,0,0,
				0,0,0,0,0,0,0,0,0,0,
				0,0,0,0,0,0,0,0,0,0,
				0,0,0,0,0,0,0,0,0,0,
				0,25,0,0,0,0,0,0,25,0,
				0,0,25,0,0,0,0,25,0,0,
				0,0,0,0,0,0,0,0,0,100,
			],
			matchRoomId: roomId,
			matchCurrentNumberOfUsers: 0,
			matchRematchCount: 0,
			serverPhysicsTickInterval: undefined,
			serverUpdateTickInterval: undefined,
			tick: true,
			clientInputs: [],
			clientStatusChanges: [],
			clientPlayerAttacks: [],
		}

		/**
		 * physics tick for the server
		 */
		games[roomId].serverPhysicsTickInterval = setInterval(() => {
			if(games[roomId].tick === false) clearInterval(games[roomId].serverPhysicsTickInterval)
			serverPhysicsTick();
		}, 1000 / 60)

		/**
		 * server update loop
		 */
		games[roomId].serverUpdateTickInterval = setInterval(() => {
			if(games[roomId].tick === false) clearInterval(games[roomId].serverUpdateTickInterval)
			serverUpdateTick()
		}, 1000 / 30)


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
	})

	/**
	 * Handles a new user-input
	 */
	socket.on('sendPlayerInput', playerInput => {
		games[roomId].clientInputs.push(playerInput)
	})

	/**
	 * Handles a new player status-change
	 */
	socket.on('sendPlayerStatusChange',statusChange => {
		games[roomId].clientStatusChanges.push(statusChange)
	})

	/**
	 * Handles a new player attack
	 */
	socket.on('sendPlayerAttack', playerAttack => {
		games[roomId].clientPlayerAttacks.push(playerAttack);
	})

	/**
	 * Movement functions
	 */
	const movePlayerRight = ( playerInput ) => {
		let playerIndex = playerInput.player === 1 ? games[roomId].matchPlayerOne.index : games[roomId].matchPlayerTwo.index
		let playerState = playerInput.player === 1 ? games[roomId].matchPlayerOne.state : games[roomId].matchPlayerTwo.state

		if((playerIndex + 1)%10 === 0){
			if(games[roomId].matchBoardGrid[playerIndex - (10 - 1)] === 25) return console.log('you are hitting a wall bro')
			if(games[roomId].matchBoardGrid[playerIndex - (10 - 1)] === 1 || games[roomId].matchBoardGrid[playerIndex - (10 - 1)] === 100) return console.log('you are hitting a wall bro')

			swap(playerIndex - (10 - 1), playerIndex - (10 - 1), 'rightWall', playerState)
		} else {
			if(games[roomId].matchBoardGrid[playerIndex + 1] === 25) return console.log('you are hitting a wall bro')
			if(games[roomId].matchBoardGrid[playerIndex + 1] === 1 || games[roomId].matchBoardGrid[playerIndex + 1] === 100) return console.log('you are hitting a wall bro')

			swap(playerIndex + 1, playerIndex + 1, playerInput.input, playerState)
		}
	}

	const movePlayerLeft = ( playerInput ) => {
		let playerIndex = playerInput.player === 1 ? games[roomId].matchPlayerOne.index : games[roomId].matchPlayerTwo.index
		let playerState = playerInput.player === 1 ? games[roomId].matchPlayerOne.state : games[roomId].matchPlayerTwo.state

		if((playerIndex + 1)%10 === 1){
			if(games[roomId].matchBoardGrid[playerIndex + (10 - 1)] === 25) return console.log('you are hitting a wall bro')
			if(games[roomId].matchBoardGrid[playerIndex + (10 - 1)] === 1 || games[roomId].matchBoardGrid[playerIndex + (10 - 1)] === 100) return console.log('you are hitting a wall bro')

			swap(playerIndex + (10 - 1), playerIndex + (10 - 1), 'leftWall', playerState)
		} else {
			if(games[roomId].matchBoardGrid[playerIndex - 1] === 25) return console.log('you are hitting a wall bro')
			if(games[roomId].matchBoardGrid[playerIndex - 1] === 1 || games[roomId].matchBoardGrid[playerIndex - 1] === 100) return console.log('you are hitting a wall bro')

			swap(playerIndex - 1, playerIndex - 1, playerInput.input, playerState)
		}
	}

	const movePlayerUp = ( playerInput ) => {
		let firstRowEnd = 10 - 1;
		let lastRowStart = 100 - 10;
		let playerIndex = playerInput.player === 1 ? games[roomId].matchPlayerOne.index : games[roomId].matchPlayerTwo.index
		let playerState = playerInput.player === 1 ? games[roomId].matchPlayerOne.state : games[roomId].matchPlayerTwo.state

		console.log(playerIndex)

		if(playerIndex <= firstRowEnd){
			let oldPlayerIndex = playerIndex;
			let temp = games[roomId].matchBoardGrid[lastRowStart + playerIndex]

			if(temp === 25) {
				games[roomId].shift();
				return console.log('there is a wall here')
			}
			if(temp === 100 || temp === 1){
				return console.log('there is a player here')
			}

			console.log(playerState, playerIndex, games[roomId].matchBoardGrid)


			if(playerState === 1){
				games[roomId].matchPlayerOne.index = lastRowStart + playerIndex;
				playerIndex = games[roomId].matchPlayerOne.index;
			} else {
				games[roomId].matchPlayerTwo.index = lastRowStart + playerIndex;
				playerIndex = games[roomId].matchPlayerTwo.index
			}

			console.log(playerIndex, playerState)
			games[roomId].matchBoardGrid[playerIndex] = playerState
			games[roomId].matchBoardGrid[oldPlayerIndex] = 0;

			games[roomId].clientInputs.shift();

			console.log('player has been swapped and input removed', games[roomId].matchBoardGrid, games[roomId].matchPlayerOne)


		} else {
			if(games[roomId].matchBoardGrid[playerIndex - 10] === 25) return console.log('you are hitting a wall bro')
			if(games[roomId].matchBoardGrid[playerIndex - 10] === 1 || games[roomId].matchBoardGrid[playerIndex + 10] === 100) return console.log('you are hitting a wall bro')

			swap(playerIndex - 10, playerIndex - 10, playerInput.input, playerState)
		}
	}

	const movePlayerDown = ( playerInput ) => {

		let lastRowStart = 100 - 10;
		let playerIndex = playerInput.player === 1 ? games[roomId].matchPlayerOne.index : games[roomId].matchPlayerTwo.index
		let playerState = playerInput.player === 1 ? games[roomId].matchPlayerOne.state : games[roomId].matchPlayerTwo.state

		if(playerIndex >= lastRowStart && playerIndex <= 100 - 1){
			let difference = playerIndex - lastRowStart
			let oldPlayerIndex = playerIndex;
			let temp = games[roomId].matchBoardGrid[difference]
			playerIndex = difference;

			if(temp === 25) {
				games[roomId].shift();
				return console.log('there is a wall here')
			}
			if(temp === 100 || temp === 1){
				return console.log('there is a player here')
			}

			console.log(playerState, playerIndex, games[roomId].matchBoardGrid)

			if(playerState === 1){
				games[roomId].matchPlayerOne.index = playerIndex;
			} else {
				games[roomId].matchPlayerTwo.index = playerIndex;
			}

			games[roomId].matchBoardGrid[playerIndex] = playerState
			games[roomId].matchBoardGrid[oldPlayerIndex] = 0;

			games[roomId].clientInputs.shift();

			console.log('player has been swapped and input removed', games[roomId].matchBoardGrid, games[roomId].matchPlayerOne)
		} else {
			if(games[roomId].matchBoardGrid[playerIndex + 10] === 25) return console.log('you are hitting a wall bro')
			if(games[roomId].matchBoardGrid[playerIndex + 10] === 1 || games[roomId].matchBoardGrid[playerIndex + 10] === 100) return console.log('you are hitting a wall bro')

			swap(playerIndex + 10, playerIndex + 10, playerInput.input, playerState)
		}
	}

	/**
	 * swap function
	 */
	const swap = (nonPlayerIndex, newPlayerIndex, keyCode, playerState) => {
		let temp = 0;

		console.log(nonPlayerIndex, newPlayerIndex, keyCode, playerState, games[roomId].matchBoardGrid)

		if(playerState === 1) {
			games[roomId].matchPlayerOne.index = newPlayerIndex
		} else if (playerState === 100) {
			games[roomId].matchPlayerTwo.index = newPlayerIndex
		}

		games[roomId].matchBoardGrid[newPlayerIndex] = playerState;
		games[roomId].matchBoardGrid[newPlayerIndex + swapLookUpTable[keyCode]] = temp;

		games[roomId].clientInputs.shift();

		console.log('player has been swapped and input removed')
	}

	/**
	 * Handle Status Change function
	 */
	const handleStatusChange = (statusChange) => {
		console.log(statusChange, 'status changing')

		if(statusChange.player === 1) {
			games[roomId].matchPlayerOne.status = statusChange.status
			games[roomId].clientStatusChanges.shift()
		} else {
			games[roomId].matchPlayerTwo.status = statusChange.status
			games[roomId].clientStatusChanges.shift()
		}
	}

	/**
	 * Handle button pressed assignments
	 */
	const assignButtonPress = (buttonPressed) => {
		if(buttonPressed.player === 1) {
			games[roomId].matchPlayerOne.buttonPressed = buttonPressed.input
		} else if (buttonPressed.player === 100) {
			games[roomId].matchPlayerTwo.buttonPressed = buttonPressed.input
		}
	}

	/**
	 * Handles Player Attacks
	 */
	const handleHorizontalPlayerAttack = ( playerAttack ) => {

		let playerIndex = playerAttack.player === 1 ? games[roomId].matchPlayerOne.index : games[roomId].matchPlayerTwo.index
		let enemy = playerAttack.player === 1 ? false : true

		if(enemy === false){
			games[roomId].matchPlayerOne.status = 'attacking';
		} else {
			games[roomId].matchPlayerTwo.status = 'attacking';
		}

		//num to sub is amount of tiles to the left, while numToAdd is amount of tiles to the right
		let numToSubtract = playerIndex % 10
		let numToAdd = 10 - numToSubtract

		console.log('about to find horizontal attack tiles')

		findAttackTiles(numToSubtract, numToAdd, playerIndex, enemy).then(() => {
			console.log('this is a horizontal attack')

			assignAttackTiles('horizontal', enemy).then(() => {
				console.log('assigned horizontal attack')
				attackCoolDown(enemy);
			});
		});
	}

	const handleVerticalPlayerAttack = ( playerAttack ) => {
		let playerIndex = playerAttack.player === 1 ? games[roomId].matchPlayerOne.index : games[roomId].matchPlayerTwo.index
		let enemy = playerAttack.player === 1 ? false : true

		if(enemy === false){
			games[roomId].matchPlayerOne.status = 'attacking';
		} else {
			games[roomId].matchPlayerTwo.status = 'attacking';
		}

		let trackingNumDownward = playerIndex - 10;
		let trackingNumUpward = playerIndex + 10;

		console.log('about to find vertical attack tiles')

		findAttackTilesVertical(trackingNumDownward, trackingNumUpward, enemy).then(() => {
			console.log('this is a vertical attack')

			assignAttackTiles('vertical', enemy).then(() => {
				console.log('assigned vertical attack')
				attackCoolDown(enemy)
			})
		})
	}

	async function findAttackTiles(numToSubtract, numToAdd, playerIndex, enemy) {
		let subtractTileIndex = playerIndex
		let addTileIndex = playerIndex - 1;
		// chooses to work through the rest of the function as either player two (enemy = true) or player one (enemy = false)
		let matchPlayer = enemy ? 'matchPlayerTwo' : 'matchPlayerOne'
		// let livesAmountString = enemy ? 'playerLives' : 'enemyLives'

		console.log('finding attack tiles')

		for(let i = 0; i < numToSubtract; i++) {
			subtractTileIndex--;

			if(subtractTileIndex !== playerIndex) {
				if(games[roomId].matchBoardGrid[subtractTileIndex] === 25) break;

				if(games[roomId].matchBoardGrid[subtractTileIndex === 10] || games[roomId].matchBoardGrid[subtractTileIndex] === 11){
					games[roomId][matchPlayer].tempTiles.push(0)
				} else if ((games[roomId].matchBoardGrid[subtractTileIndex] === 1 && enemy === true) || (games[roomId].matchBoardGrid[subtractTileIndex] === 100 && enemy === false)) {
					handleLivesAmount(enemy)
					continue;
				} else {
					games[roomId][matchPlayer].tempTiles.push(games[roomId].matchBoardGrid[subtractTileIndex])
				}
				games[roomId][matchPlayer].attackTiles.push(subtractTileIndex)
			}
		}
		for(let i = 0; i < numToAdd; i++){
			addTileIndex++;
			if(addTileIndex !== playerIndex){
				if(games[roomId].matchBoardGrid[addTileIndex] === 25) break;

				if(games[roomId].matchBoardGrid[addTileIndex] === 10 || games[roomId].matchBoardGrid[addTileIndex] === 11){
					games[roomId][matchPlayer].tempTiles.push(0)
				} else if ((games[roomId].matchBoardGrid[addTileIndex] === 1 && enemy === true) || (games[roomId].matchBoardGrid[addTileIndex] === 100 && enemy === false)) {
					handleLivesAmount(enemy)
					continue;
				} else {
					games[roomId][matchPlayer].tempTiles.push(games[roomId].matchBoardGrid[addTileIndex])
				}
				games[roomId][matchPlayer].attackTiles.push(addTileIndex)
			}
		}
	}

	async function findAttackTilesVertical(numDownward, numUpward, enemy){
		// chooses to work through the rest of the function as either player two (enemy = true) or player one (enemy = false)
		let matchPlayer = enemy ? 'matchPlayerTwo' : 'matchPlayerOne'

		if(numDownward >= 0) {
			if(games[roomId].matchBoardGrid[numDownward] === 25) {
				console.log('you are hitting a wall downward')
			} else if(games[roomId].matchBoardGrid[numDownward] === 10 || games[roomId].matchBoardGrid[numDownward] === 11){
				games[roomId][matchPlayer].tempTiles.push(0)
				games[roomId][matchPlayer].attackTiles.push(numDownward);
			} else if (games[roomId].matchBoardGrid[numDownward] === 1 || games[roomId].matchBoardGrid[numDownward] === 100) {
				handleLivesAmount(enemy)
			} else {
				games[roomId][matchPlayer].tempTiles.push(games[roomId].matchBoardGrid[numDownward])
				games[roomId][matchPlayer].attackTiles.push(numDownward);
			}
		}
		if(numUpward < 100) {
			if(games[roomId].matchBoardGrid[numUpward] === 25){
				console.log('you are hitting a wall upward')
			} else if(games[roomId].matchBoardGrid[numUpward] === 10 || games[roomId].matchBoardGrid[numUpward] === 11){
				games[roomId][matchPlayer].tempTiles.push(0)
				games[roomId][matchPlayer].attackTiles.push(numUpward)
			} else if (games[roomId].matchBoardGrid[numUpward] === 1 || games[roomId].matchBoardGrid[numUpward] === 100) {
				handleLivesAmount(enemy)
			} else {
				games[roomId][matchPlayer].tempTiles.push(games[roomId].matchBoardGrid[numUpward])
				games[roomId][matchPlayer].attackTiles.push(numUpward)
			}
		}

		while(numDownward - 10 >= 0){
			numDownward = numDownward - 10;

			if(games[roomId].matchBoardGrid[numDownward + 10] === 25) break;
			if(games[roomId].matchBoardGrid[numDownward] === 25) break;

			if(games[roomId].matchBoardGrid[numDownward] === 10 || games[roomId].matchBoardGrid[numDownward] === 11){
				games[roomId][matchPlayer].tempTiles.push(0)
			} else if (games[roomId].matchBoardGrid[numDownward] === 1 || games[roomId].matchBoardGrid[numDownward] === 100) {
				handleLivesAmount(enemy)
				continue;
			} else {
				games[roomId][matchPlayer].tempTiles.push(games[roomId].matchBoardGrid[numDownward])
			}

			games[roomId][matchPlayer].attackTiles.push(numDownward);
		}
		while(numUpward + 10 < 100){
			numUpward = numUpward + 10;

			if(games[roomId].matchBoardGrid[numUpward - 10] === 25) break;
			if(games[roomId].matchBoardGrid[numUpward] === 25) break;

			if(games[roomId].matchBoardGrid[numUpward] === 10 || games[roomId].matchBoardGrid[numUpward] === 11){
				games[roomId][matchPlayer].tempTiles.push(0)
			} else if (games[roomId].matchBoardGrid[numUpward] === 1 || games[roomId].matchBoardGrid[numUpward] === 100) {
				handleLivesAmount(enemy)
				continue;
			} else {
				games[roomId][matchPlayer].tempTiles.push(games[roomId].matchBoardGrid[numUpward])
			}

			games[roomId][matchPlayer].attackTiles.push(numUpward);
		}
	}

	async function assignAttackTiles(direction, enemy) {
		let matchPlayer = enemy ? 'matchPlayerTwo' : 'matchPlayerOne'

		games[roomId][matchPlayer].attackTiles.forEach((attackTile,index) =>{
			games[roomId].matchBoardGrid[attackTile] = direction === 'horizontal' ? 10 : 11
		})
	}

	async function resetAttackTiles(enemy) {
		let matchPlayer = enemy ? 'matchPlayerTwo' : 'matchPlayerOne'

		console.log('resetting attack', games[roomId][matchPlayer].tempTiles)

		games[roomId][matchPlayer].attackTiles.forEach((value, index) => {
			games[roomId].matchBoardGrid[value] = games[roomId][matchPlayer].tempTiles[index]
		})
	}

	const attackCoolDown = (enemy) => {

		games[roomId].clientPlayerAttacks.shift()

		console.log(enemy, 'we are cooling down', process.uptime(), games[roomId].clientPlayerAttacks)

		setTimeout(() => {
			resetAttackTiles(enemy).then(() => {
				let matchPlayer = enemy ? 'matchPlayerTwo' : 'matchPlayerOne'

				if(enemy === false){
					games[roomId].matchPlayerOne.status = 'normal'
				} else if (enemy === true){
					games[roomId].matchPlayerTwo.status = 'normal'
				}
				games[roomId][matchPlayer].tempTiles = [];
				games[roomId][matchPlayer].attackTiles = [];

				//player attack ends here
				console.log('player attack ended', matchPlayer, games[roomId].clientPlayerAttacks, process.uptime())
			})
		}, 250)
	}

	/**
	 * Handles player lives
	 */
	const handleLivesAmount = (enemy, livesAmountString) => {

	}

	/**
	 * Handles the player Lives
	 */
	socket.on('sendPlayerLives', lives => {
		console.log(lives.player, lives.lives, 'changing the player lives')

		if(lives.player === 1) {
			games[roomId].matchPlayerOne.lives = lives.lives
		} else if (lives.player === 100) {
			games[roomId].matchPlayerTwo.lives = lives.lives
		}
	})

	/**
	 * Handles when a socket disconnects
	 */
	socket.on('disconnectFromRoom', player => {
		console.log(player, games[roomId].matchIDs.length)

		if(player === 1){

			if(games[roomId].matchIDs.length === 1){
				games[roomId].tick = false;

				setTimeout(() => {
					delete games[roomId]
					console.log(games)
				}, 1000 / 15)
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
					buttonPressed: 'down',
				}

				io.to(roomId).emit('giveUserInformation', {
					playerOne: games[roomId].matchPlayerOne,
					playerTwo: games[roomId].matchPlayerTwo,
					boardState: games[roomId].matchBoardGrid,
				})
			}

		} else if (player === 100) {

			if(games[roomId].matchIDs.length === 1){
				games[roomId].tick = false;

				setTimeout(() => {
					delete games[roomId]
					console.log(games);
				}, 1000 / 15)
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
					buttonPressed: 'up'
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
			games[roomId].tick = false;

			setTimeout(() => {
				delete games[roomId]
				console.log(games)
			}, 1000 / 15)
		} else {
			games[roomId].matchCurrentNumberOfUsers--;
			console.log(games[roomId].matchCurrentNumberOfUsers)
		}
	})

	socket.on('sendAddToRematch', rematch => {
		if(games[roomId].matchRematchCount === 1){
			let matchUserNames = games[roomId].matchUserNames;
			let matchUserIDs = games[roomId].matchIDs;

			games[roomId].tick = false

			setTimeout(() => {
				games[roomId] = {
					matchUserNames: matchUserNames,
					matchIDs: matchUserIDs,
					matchPlayerOne: {
						id: '',
						username: '',
						index: 0,
						state: 1,
						status: 'normal',
						attackTiles: [],
						tempTiles: [],
						lives: 50,
						buttonPressed: 'down',
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
						buttonPressed: 'up',
					},
					matchBoardGrid: [
						1,0,0,0,0,0,0,0,0,0,
						0,0,25,0,0,0,0,25,0,0,
						0,25,0,0,0,0,0,0,25,0,
						0,0,0,0,0,0,0,0,0,0,
						0,0,0,0,0,0,0,0,0,0,
						0,0,0,0,0,0,0,0,0,0,
						0,0,0,0,0,0,0,0,0,0,
						0,25,0,0,0,0,0,0,25,0,
						0,0,25,0,0,0,0,25,0,0,
						0,0,0,0,0,0,0,0,0,100,
					],
					matchRoomId: roomId,
					matchCurrentNumberOfUsers: 2,
					matchRematchCount: 0,
					serverPhysicsTickInterval: undefined,
					serverUpdateTickInterval: undefined,
					tick: true,
					clientInputs: [],
					clientStatusChanges: [],
					clientPlayerAttacks: [],
				}

				/**
				 * physics tick for the server
				 */
				games[roomId].serverPhysicsTickInterval = setInterval(() => {
					if(games[roomId].tick === false) {
						console.log('tick has been set to false physics')
						clearInterval(games[roomId].serverPhysicsTickInterval)
					}
					serverPhysicsTick();
				}, 1000 / 60)

				/**
				 * server update loop
				 */
				games[roomId].serverUpdateTickInterval = setInterval(() => {
					if(games[roomId].tick === false) {
						console.log('tick has been set to false server')
						clearInterval(games[roomId].serverUpdateTickInterval)
					}
					serverUpdateTick()
				}, 1000 / 30)


				io.to(roomId).emit('givePlayerHealth', {
					playerOne: games[roomId].matchPlayerOne,
					playerTwo: games[roomId].matchPlayerTwo,
				})
				io.to(roomId).emit('giveRestartGame')
			}, 1000/15)

			console.log('sending to restart game!')
		} else {
			games[roomId].matchRematchCount++;
			io.to(roomId).emit('givePlayerRematchCount', {
				rematchCount: games[roomId].matchRematchCount,
			})
		}
	})

	console.log(' a user connected ! ')
})

// io.on('connection', (socket) => {
// 	let query = socket.handshake.query;
// 	let roomId = query.roomId;
//
// 	socket.join(roomId)
//
// 	if(!games[roomId]) {
// 		console.log('room not in game')
//
// 		games[roomId] = {
// 			matchUserNames: [],
// 			matchIDs: [],
// 			matchPlayerOne: {
// 				id: '',
// 				username: '',
// 				index: 0,
// 				state: 1,
// 				status: 'normal',
// 				attackTiles: [],
// 				tempTiles: [],
// 				lives: 50,
// 			},
// 			matchPlayerTwo: {
// 				id: '',
// 				username: '',
// 				index: 99,
// 				state: 100,
// 				status: 'normal',
// 				attackTiles: [],
// 				tempTiles: [],
// 				lives: 50,
// 			},
// 			matchBoardGrid: [
// 				0,0,0,0,0,0,0,0,0,0,
// 				0,0,25,0,0,0,0,25,0,0,
// 				0,25,0,0,0,0,0,0,25,0,
// 				0,0,0,0,0,0,0,0,0,0,
// 				0,0,0,0,0,0,0,0,0,0,
// 				0,0,0,0,0,0,0,0,0,0,
// 				0,0,0,0,0,0,0,0,0,0,
// 				0,25,0,0,0,0,0,0,25,0,
// 				0,0,25,0,0,0,0,25,0,0,
// 				0,0,0,0,0,0,0,0,0,0,
// 			],
// 			matchRoomId: roomId,
// 			matchCurrentNumberOfUsers: 0,
// 			matchRematchCount: 0,
// 		}
// 	} else {
// 		console.log('room is already in game')
// 	}
//
//
// 	games['key 1'] = 'bruh';
//
// 	console.log(roomId, query)
//
// 	/**
// 	 * Emit to the socket so that the user gets the users and userIDs when the join the lobby
// 	 */
// 	socket.emit('userJoined', {
// 		users: games[roomId].matchUserNames,
// 		userIDs: games[roomId].matchIDs,
// 	})
//
// 	/**
// 	 * Handles a new user joining
// 	 */
// 	socket.on('newUser', username => {
// 		if(games[roomId].matchIDs.length === 2) return console.log('no more users can enter the match')
//
// 		games[roomId].matchCurrentNumberOfUsers++;
//
// 		console.log('new user called!', username.id, username.username, games[roomId].matchCurrentNumberOfUsers)
//
// 		socket.username = username.username;
// 		socket.playerId = username.id;
// 		games[roomId].matchUserNames.push(username.username)
// 		games[roomId].matchIDs.push(username.id)
//
// 		console.log(games[roomId].matchUserNames, games[roomId].matchIDs)
//
// 		if( username.id === games[roomId].matchIDs[0] ) {
// 			console.log('we are assigning the id and username')
// 			games[roomId].matchPlayerOne.id = username.id
// 			games[roomId].matchPlayerOne.username = username.username
// 			console.log('we have assigned them', games[roomId].matchPlayerOne.username)
// 		} else if ( username.id === games[roomId].matchIDs[1] ) {
// 			games[roomId].matchPlayerTwo.id = username.id
// 			games[roomId].matchPlayerTwo.username = username.username
// 		}
//
// 		console.log('about to emit')
//
// 		io.to(roomId).emit('userOnline', {
// 			users: games[roomId].matchUserNames,
// 			userIDs: games[roomId].matchIDs,
// 			boardState: games[roomId].matchBoardGrid,
// 		})
//
// 		io.to(roomId).emit('giveUserInformation', {
// 			playerOne: games[roomId].matchPlayerOne,
// 			playerTwo: games[roomId].matchPlayerTwo,
// 			boardState: games[roomId].matchBoardGrid,
// 		})
// 	})
//
// 	/**
// 	 * Updates the player status
// 	 */
// 	socket.on('sendChangePlayerStatus', statusChange => {
// 		if(statusChange.player === 1){
// 			games[roomId].matchPlayerOne.status = statusChange.status;
// 			games[roomId].matchPlayerOne.index = statusChange.index;
// 			console.log(games[roomId].matchPlayerOne.status, 1)
// 			io.to(roomId).emit('giveChangePlayerStatus', {
// 				playerOne: games[roomId].matchPlayerOne,
// 				playerTwo: games[roomId].matchPlayerTwo,
// 				boardState: games[roomId].matchBoardGrid,
// 			})
// 		} else if (statusChange.player === 100){
// 			games[roomId].matchPlayerTwo.status = statusChange.status;
// 			games[roomId].matchPlayerTwo.index = statusChange.index;
// 			console.log(games[roomId].matchPlayerTwo.status, 100)
// 			io.to(roomId).emit('giveChangePlayerStatus', {
// 				playerOne: games[roomId].matchPlayerOne,
// 				playerTwo: games[roomId].matchPlayerTwo,
// 				boardState: games[roomId].matchBoardGrid,
// 			})
// 		}
// 	})
//
// 	/**
// 	 * Updates the player index + board
// 	 */
// 	socket.on('sendUpdatePlayerIndex', indexChange => {
// 		if(indexChange.player === 1){
// 			console.log(games[roomId].matchPlayerOne.index, indexChange.index, indexChange.oldIndex, indexChange.oldValue, 'player one')
// 			games[roomId].matchPlayerOne.index = indexChange.index;
// 			games[roomId].matchBoardGrid[indexChange.index] = indexChange.player;
// 			games[roomId].matchBoardGrid[indexChange.oldIndex] = indexChange.oldValue;
//
// 			io.to(roomId).emit('giveUserInformation', {
// 				playerOne: games[roomId].matchPlayerOne,
// 				playerTwo: games[roomId].matchPlayerTwo,
// 				boardState: games[roomId].matchBoardGrid,
// 			})
// 		} else if (indexChange.player === 100){
// 			console.log(games[roomId].matchPlayerTwo.index, indexChange.index, indexChange.oldIndex, indexChange.oldValue, 'player two')
// 			games[roomId].matchPlayerTwo.index = indexChange.index;
// 			games[roomId].matchBoardGrid[indexChange.index] = indexChange.player;
// 			games[roomId].matchBoardGrid[indexChange.oldIndex] = indexChange.oldValue;
//
// 			io.to(roomId).emit('giveUserInformation', {
// 				playerOne: games[roomId].matchPlayerOne,
// 				playerTwo: games[roomId].matchPlayerTwo,
// 				boardState: games[roomId].matchBoardGrid,
// 			})
// 		}
// 	})
//
// 	/**
// 	 * Handles the player attacks
// 	 */
// 	socket.on('sendPlayerAttack', attack => {
// 		console.log(attack.boardState, attack.player)
//
// 		if(attack.player === 1) {
// 			games[roomId].matchBoardGrid = attack.boardState
// 			io.to(roomId).emit('givePlayerAttack', {
// 				boardState: games[roomId].matchBoardGrid
// 			})
// 		} else if (attack.player === 100) {
// 			games[roomId].matchBoardGrid = attack.boardState
// 			io.to(roomId).emit('givePlayerAttack', {
// 				boardState: games[roomId].matchBoardGrid
// 			})
// 		}
// 	})
//
// 	/**
// 	 * Handles the player Lives
// 	 */
// 	socket.on('sendPlayerLives', lives => {
// 		console.log(lives.player, lives.lives, 'changing the player lives')
//
// 		if(lives.player === 1) {
// 			games[roomId].matchPlayerOne.lives = lives.lives
// 			io.to(roomId).emit('givePlayerHealth', {
// 				playerOne: games[roomId].matchPlayerOne,
// 				playerTwo: games[roomId].matchPlayerTwo,
// 			})
// 		} else if (lives.player === 100) {
// 			games[roomId].matchPlayerTwo.lives = lives.lives
// 			io.to(roomId).emit('givePlayerHealth', {
// 				playerOne: games[roomId].matchPlayerOne,
// 				playerTwo: games[roomId].matchPlayerTwo,
// 			})
// 		}
// 	})
//
// 	/**
// 	 * Handles when a socket disconnects
// 	 */
// 	socket.on('disconnectFromRoom', player => {
// 		console.log(player)
//
// 		if(player === 1){
// 			console.log(games[roomId].matchIDs.length)
// 			if(games[roomId].matchIDs.length === 1){
// 				delete games[roomId]
// 				console.log(games);
// 			} else {
// 				games[roomId].matchUserNames.shift();
// 				games[roomId].matchIDs.shift();
// 				games[roomId].matchPlayerOne = {
// 					id: '',
// 					username: '',
// 					index: 0,
// 					state: 1,
// 					status: 'normal',
// 					attackTiles: [],
// 					tempTiles: [],
// 					lives: 50,
// 				}
//
// 				io.to(roomId).emit('giveUserInformation', {
// 					playerOne: games[roomId].matchPlayerOne,
// 					playerTwo: games[roomId].matchPlayerTwo,
// 					boardState: games[roomId].matchBoardGrid,
// 				})
// 			}
//
// 		} else if (player === 100) {
//
// 			if(games[roomId].matchIDs.length === 1){
// 				delete games[roomId]
// 				console.log(games);
// 			} else {
// 				games[roomId].matchUserNames.pop();
// 				games[roomId].matchIDs.pop();
// 				games[roomId].matchPlayerTwo = {
// 					id: '',
// 					username: '',
// 					index: 99,
// 					state: 100,
// 					status: 'normal',
// 					attackTiles: [],
// 					tempTiles: [],
// 					lives: 50,
// 				}
//
// 				io.to(roomId).emit('giveUserInformation', {
// 					playerOne: games[roomId].matchPlayerOne,
// 					playerTwo: games[roomId].matchPlayerTwo,
// 					boardState: games[roomId].matchBoardGrid,
// 				})
// 			}
//
// 		}
// 	})
//
// 	socket.on('disconnect', () => {
// 		console.log('the user has disconnected', roomId)
// 		if(!games[roomId]) return console.log('there is no room of that id')
// 		if(games[roomId].matchCurrentNumberOfUsers === 1){
// 			console.log('we are about to delete the room')
// 			delete games[roomId]
// 			console.log(games)
// 		} else {
// 			games[roomId].matchCurrentNumberOfUsers--;
// 			console.log(games[roomId].matchCurrentNumberOfUsers)
// 		}
// 	})
//
// 	socket.on('sendAddToRematch', rematch => {
// 		if(games[roomId].matchRematchCount === 1){
// 			games[roomId] = {
// 				matchUserNames: [],
// 				matchIDs: [],
// 				matchPlayerOne: {
// 					id: '',
// 					username: '',
// 					index: 0,
// 					state: 1,
// 					status: 'normal',
// 					attackTiles: [],
// 					tempTiles: [],
// 					lives: 50,
// 				},
// 				matchPlayerTwo: {
// 					id: '',
// 					username: '',
// 					index: 99,
// 					state: 100,
// 					status: 'normal',
// 					attackTiles: [],
// 					tempTiles: [],
// 					lives: 50,
// 				},
// 				matchBoardGrid: [
// 					0,0,0,0,0,0,0,0,0,0,
// 					0,0,25,0,0,0,0,25,0,0,
// 					0,25,0,0,0,0,0,0,25,0,
// 					0,0,0,0,0,0,0,0,0,0,
// 					0,0,0,0,0,0,0,0,0,0,
// 					0,0,0,0,0,0,0,0,0,0,
// 					0,0,0,0,0,0,0,0,0,0,
// 					0,25,0,0,0,0,0,0,25,0,
// 					0,0,25,0,0,0,0,25,0,0,
// 					0,0,0,0,0,0,0,0,0,0,
// 				],
// 				matchRoomId: roomId,
// 				matchCurrentNumberOfUsers: 0,
// 				matchRematchCount: 0,
// 			}
// 			io.to(roomId).emit('giveUserInformation', {
// 				playerOne: games[roomId].matchPlayerOne,
// 				playerTwo: games[roomId].matchPlayerTwo,
// 				boardState: games[roomId].matchBoardGrid,
// 			})
// 			io.to(roomId).emit('givePlayerHealth', {
// 				playerOne: games[roomId].matchPlayerOne,
// 				playerTwo: games[roomId].matchPlayerTwo,
// 			})
// 			io.to(roomId).emit('giveRestartGame')
// 		} else {
// 			games[roomId].matchRematchCount++;
// 			io.to(roomId).emit('givePlayerRematchCount', {
// 				rematchCount: games[roomId].matchRematchCount,
// 			})
// 		}
// 	})
//
// 	console.log(' a user connected ! ')
// })

server.listen(PORT, () => {
	console.log('listening on *:4000')
})

