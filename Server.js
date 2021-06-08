const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
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

dotenv.config();

let collectionName = 'Time-Trials'
let userCollectionName = 'Soundcloud-Stardum-Royale-2099-Users'

let games = {}

const PORT = process.env.PORT || 4000;
const INDEX = '/index.html';
const CONNECT_URL = `${process.env.DB_KEY}`

console.log(CONNECT_URL)

app.use(cors());
app.use(bodyParser.json());

app.get('/test', (req,res) => {
	console.log('i am sending this')
	res.send('<h1>This is where the data will be</h1>')
})

app.post('/login', async (req,res) => {
	try{
		console.log('request body (data)', req.body)
		let userId = req.body.userId;
		let userGoogleName = req.body.userGoogleName

		console.log(userId, userGoogleName)

		MongoClient.connect(CONNECT_URL, { useUnifiedTopology: true})
			.then( async (connection) => {
				try{
					console.log('connected to the database!')

					let database = connection.db('Soundcloud-Stardum-Royale-Time-Trials')
					let collection = database.collection(userCollectionName)

					let userExist = await collection.findOne({userId: userId})

					console.log(userExist);

					if(userExist) {
						console.log('this user already exist, so we gonna log them in')
						res.send(userExist)
						await connection.close()
						return console.log('the connection to the database has been closed')
					}

					console.log('we are registering the user')

					const user = await collection.insertOne({
						userId: userId,
						userGoogleName: userGoogleName,
						'time-trial-I': {
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-I',
						},
						'time-trial-II': {
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-II',
						},
						'time-trial-III': {
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-III',
						},
						'time-trial-IV': {
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-IV',
						},
						'time-trial-V': {
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-V',
						},
						'time-trial-VI': {
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-VI',
						},
						'time-trial-VII': {
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-VII',
						},
						'time-trial-VIII': {
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-VIII',
						},
						'time-trial-IX': {
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-IX',
						},
						'time-trial-X': {
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-X',
						},
						'time-trial-all':{
							bestTime: undefined,
							times: [],
							stepCounts: [],
							wallHitCounts: [],
							stepAccuracyCounts: [],
							trialName: 'time-trial-all',
						},
						pvpStats:{
							wins: 0,
							losses: 0,
							experience: 0,
						}
					})

					const myUser = await collection.findOne({
						userId: userId,
					})

					console.log(myUser, 'this is from the database')

					res.send(myUser)

					await connection.close();

					console.log('the database connection has been closed')

				} catch(err) {
					console.log(err)
				}
			})
	} catch (err) {
		console.log(err)
	}


})

app.put('/updateTime', async (req,res) => {
	try{
		console.log('request body (data)', req.body)
		let userId = req.body.userId;
		let timeTrial = req.body.timeTrial;
		let timeTrialTime = req.body.timeTrialTime;
		let date = req.body.timeDate;
		let stepCount = req.body.stepCount
		let wallHitCount = req.body.wallHitCount
		let stepAccuracy = req.body.stepAccuracy.toFixed(2)

		console.log('here is the update', userId, timeTrial, timeTrialTime, date)

		MongoClient.connect(CONNECT_URL, { useUnifiedTopology: true})
			.then( async (connection) => {
				try{
					console.log('connected to the database to update player Time!')

					let database = connection.db('Soundcloud-Stardum-Royale-Time-Trials')
					let collection = database.collection(userCollectionName)

					let updateObject = {
						time: timeTrialTime,
						date: date,
					}
					let updateStepsObject = {
						stepCount: stepCount,
						date: date,
					}
					let updateWallHitsObject = {
						wallHitCount: wallHitCount,
						date: date,
					}
					let updateStepAccuracyObject = {
						stepAccuracy: stepAccuracy,
						date: date,
					}

					let userUpdateTime = await collection.findOneAndUpdate(
						{ userId: userId},
						{ $push: {
							[`${timeTrial}.times`]:  updateObject,
							[`${timeTrial}.stepCounts`]: updateStepsObject,
							[`${timeTrial}.wallHitCounts`]: updateWallHitsObject,
							[`${timeTrial}.stepAccuracyCounts`]: updateStepAccuracyObject
							}
						},
					)

					let user = await collection.findOne({userId: userId})

					console.log('this is the user', user['time-trial-I'], 'we are updating the user')


					if(userUpdateTime) {
						console.log('about to send the updated user times')
						res.send(user)
						await connection.close()
						return console.log('the connection to the database has been closed')
					}

				} catch(err) {
					console.log(err)
				}
			})
	} catch (err) {
		console.log(err)
	}
})

app.put('/updateBestTime', async (req,res) => {
	try{
		console.log('request body (data)', req.body)
		let userId = req.body.userId;
		let timeTrial = req.body.timeTrial;
		let newBestTime = req.body.newBestTime;
		let date = req.body.timeDate;
		let stepCount = req.body.stepCount
		let wallHitCount = req.body.wallHitCount
		let stepAccuracy = req.body.stepAccuracy.toFixed(2)


		console.log('here is the update', userId, timeTrial, newBestTime, date)

		MongoClient.connect(CONNECT_URL, { useUnifiedTopology: true})
			.then( async (connection) => {
				try{
					console.log('connected to the database to update player Time!')

					let database = connection.db('Soundcloud-Stardum-Royale-Time-Trials')
					let collection = database.collection(userCollectionName)

					let updateBestTimeObject = {
						time: newBestTime,
						date: date
					}
					let updateTimeObject = {
						time: newBestTime,
						date: date,
					}
					let updateStepsObject = {
						stepCount: stepCount,
						date: date,
					}
					let updateWallHitsObject = {
						wallHitCount: wallHitCount,
						date: date,
					}
					let updateStepAccuracyObject = {
						stepAccuracy: stepAccuracy,
						date: date,
					}

					let userUpdateTime = await collection.findOneAndUpdate(
						{ userId: userId},
						{ $set: {
								[`${timeTrial}.bestTime`]:  updateBestTimeObject,
							}
						},
					)

					let userUpdateOthers = await collection.findOneAndUpdate(
						{ userId: userId },
						{ $push: {
								[`${timeTrial}.times`]:  updateTimeObject,
								[`${timeTrial}.stepCounts`]: updateStepsObject,
								[`${timeTrial}.wallHitCounts`]: updateWallHitsObject,
								[`${timeTrial}.stepAccuracyCounts`]: updateStepAccuracyObject
							}
						}
					)

					let user = await collection.findOne({userId: userId})

					console.log('this is the user', user[timeTrial], 'we are updating the user')


					if(userUpdateOthers) {
						console.log('we are about to send the new best time')
						res.send(user)
						await connection.close()
						return console.log('the connection to the database has been closed')
					}

				} catch(err) {
					console.log(err)
				}
			})
	} catch (err) {
		console.log(err)
	}
})

app.get('/time-trial-times/:trial', (req, res) => {

	console.log('this request is being made!')

	let result = {'error': 'there are no times'}

	let timeTrialSelected = req.params.trial

	console.log(timeTrialSelected)

	MongoClient.connect(CONNECT_URL, { useUnifiedTopology: true })
		.then(connection => {
			let database = connection.db('Soundcloud-Stardum-Royale-Time-Trials')
			let collection = database.collection(collectionName)

			let cursor = collection.find({levelName: timeTrialSelected})

			let leaderBoard = []

			cursor.forEach(document => {

				leaderBoard = document.levelLeaderBoard

				console.log(leaderBoard)
			}, () => {
				connection.close();
				return res.json(leaderBoard);
			})

		})
		.catch(error => {
			console.log('error: ' + error);
		})

})

app.use((req, res) => res.sendFile(INDEX, { root: __dirname }))

const swapLookUpTable = {
	'left': 1,
	'right': -1,
	'up': 10,
	'down': -10,
	'rightWall': 9,
	'leftWall': -9,
}

let maps = {
	'classic': [
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
	'contained': [
		1,0,25,25,25,25,25,25,0,0,
		0,0,0,0,0,0,0,0,0,0,
		25,0,0,0,0,0,0,0,0,25,
		25,0,0,0,0,0,0,0,0,25,
		25,0,0,0,0,0,0,0,0,25,
		25,0,0,0,0,0,0,0,0,25,
		25,0,0,0,0,0,0,0,0,25,
		25,0,0,0,0,0,0,0,0,25,
		0,0,0,0,0,0,0,0,0,0,
		0,0,25,25,25,25,25,25,0,100,
	],
	'big dot': [
		1,0,0,0,0,0,0,0,0,0,
		0,0,0,0,0,0,0,0,0,0,
		0,0,0,0,0,0,0,0,0,0,
		0,0,0,25,25,25,25,0,0,0,
		0,0,0,25,25,25,25,0,0,0,
		0,0,0,25,25,25,25,0,0,0,
		0,0,0,25,25,25,25,0,0,0,
		0,0,0,0,0,0,0,0,0,0,
		0,0,0,0,0,0,0,0,0,0,
		0,0,0,0,0,0,0,0,0,100,
	]
}

io.on('connection', (socket) => {
	let query = socket.handshake.query;
	let roomId = query.roomId;
	let map = query.mapId;

	socket.join(roomId)

	console.log(map, query.mapId)

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

		//loop through queued melee attacks (they get their own queue so we can still shift() regular attacks, since melee
		//attacks have a different cool down then regular attacks
		for(let meleeAttack of games[roomId].clientMeleeAttacks){
			handleMeleePlayerAttack(meleeAttack)
		}

		//loop through queued player inputs
		for(let playerInput of games[roomId].clientInputs){
			if(playerInput.input === 'right') {
				assignButtonPress(playerInput);
				movePlayerRight(playerInput);
				console.log('the input is right')
			} else if (playerInput.input === 'left') {
				assignButtonPress(playerInput);
				movePlayerLeft(playerInput);
				console.log('the input is left')
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

		//use spread operator to make a copy of the map, so we don't mutate the reference maps so other games can use them
		let boardCopy = [...maps[map]];

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
				meleeAttackTiles: [],
				meleeTempTiles: [],
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
				meleeAttackTiles: [],
				meleeTempTiles: [],
				lives: 50,
				buttonPressed: 'up',
			},
			matchBoardGrid: boardCopy,
			matchRoomId: roomId,
			matchCurrentNumberOfUsers: 0,
			matchRematchCount: 0,
			serverPhysicsTickInterval: undefined,
			serverUpdateTickInterval: undefined,
			tick: true,
			clientInputs: [],
			clientStatusChanges: [],
			clientPlayerAttacks: [],
			clientMeleeAttacks: [],
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


		console.log(games[roomId].matchBoardGrid, boardCopy, map)
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
	 * Handles a new melee attack
	 */
	socket.on('sendMeleeAttack', meleeAttack => {
		games[roomId].clientMeleeAttacks.push(meleeAttack)
	})

	/**
	 * Movement functions
	 */
	const movePlayerRight = ( playerInput ) => {
		let playerIndex = playerInput.player === 1 ? games[roomId].matchPlayerOne.index : games[roomId].matchPlayerTwo.index
		let playerState = playerInput.player === 1 ? games[roomId].matchPlayerOne.state : games[roomId].matchPlayerTwo.state

		if((playerIndex + 1)%10 === 0){
			if(games[roomId].matchBoardGrid[playerIndex - (10 - 1)] === 25) return games[roomId].clientInputs.shift();
			if(games[roomId].matchBoardGrid[playerIndex - (10 - 1)] === 1 || games[roomId].matchBoardGrid[playerIndex - (10 - 1)] === 100) return games[roomId].clientInputs.shift();

			swap(playerIndex - (10 - 1), playerIndex - (10 - 1), 'rightWall', playerState)
		} else {
			if(games[roomId].matchBoardGrid[playerIndex + 1] === 25) return games[roomId].clientInputs.shift();
			if(games[roomId].matchBoardGrid[playerIndex + 1] === 1 || games[roomId].matchBoardGrid[playerIndex + 1] === 100) return games[roomId].clientInputs.shift();

			swap(playerIndex + 1, playerIndex + 1, playerInput.input, playerState)
		}
	}

	const movePlayerLeft = ( playerInput ) => {
		let playerIndex = playerInput.player === 1 ? games[roomId].matchPlayerOne.index : games[roomId].matchPlayerTwo.index
		let playerState = playerInput.player === 1 ? games[roomId].matchPlayerOne.state : games[roomId].matchPlayerTwo.state

		if((playerIndex + 1)%10 === 1){
			if(games[roomId].matchBoardGrid[playerIndex + (10 - 1)] === 25) return games[roomId].clientInputs.shift();
			if(games[roomId].matchBoardGrid[playerIndex + (10 - 1)] === 1 || games[roomId].matchBoardGrid[playerIndex + (10 - 1)] === 100) return games[roomId].clientInputs.shift();

			swap(playerIndex + (10 - 1), playerIndex + (10 - 1), 'leftWall', playerState)
		} else {
			if(games[roomId].matchBoardGrid[playerIndex - 1] === 25) return games[roomId].clientInputs.shift();
			if(games[roomId].matchBoardGrid[playerIndex - 1] === 1 || games[roomId].matchBoardGrid[playerIndex - 1] === 100) return games[roomId].clientInputs.shift();

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
				games[roomId].clientInputs.shift();
				return console.log('there is a wall here')
			}
			if(temp === 100 || temp === 1){
				games[roomId].clientInputs.shift();
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
			if(games[roomId].matchBoardGrid[playerIndex - 10] === 25) return games[roomId].clientInputs.shift();
			if(games[roomId].matchBoardGrid[playerIndex - 10] === 1 || games[roomId].matchBoardGrid[playerIndex + 10] === 100) return games[roomId].clientInputs.shift();

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
				games[roomId].clientInputs.shift();
				return console.log('there is a wall here')
			}
			if(temp === 100 || temp === 1){
				games[roomId].clientInputs.shift();
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
			if(games[roomId].matchBoardGrid[playerIndex + 10] === 25) return games[roomId].clientInputs.shift();
			if(games[roomId].matchBoardGrid[playerIndex + 10] === 1 || games[roomId].matchBoardGrid[playerIndex + 10] === 100) return games[roomId].clientInputs.shift();

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

		console.log('player has been swapped and input removed', maps[map])
	}

	/**
	 * Handle Status Change function
	 */
	const handleStatusChange = (statusChange) => {
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
	const handleMeleePlayerAttack = ( meleeAttack ) => {

		findMeleeTiles(meleeAttack.player, meleeAttack.type).then(() => {
			console.log('assigning melee tiles', games[roomId].matchPlayerOne.meleeAttackTiles)
			assignMeleeTiles(meleeAttack.player).then(() => {
				meleeAttackCoolDown(meleeAttack.player)
			});
		})
	}

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
					handleLivesAmountRegular(enemy)
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
					handleLivesAmountRegular(enemy)
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
				handleLivesAmountRegular(enemy)
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
				handleLivesAmountRegular(enemy)
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
				handleLivesAmountRegular(enemy)
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
				handleLivesAmountRegular(enemy)
				continue;
			} else {
				games[roomId][matchPlayer].tempTiles.push(games[roomId].matchBoardGrid[numUpward])
			}

			games[roomId][matchPlayer].attackTiles.push(numUpward);
		}
	}

	//warning: ugly code ahead, enter if ye dare
	async function findMeleeTiles(player, type) {
		let playerIndex = player === 1 ? games[roomId].matchPlayerOne.index : games[roomId].matchPlayerTwo.index
		let currentPlayer  = player === 1 ? 'matchPlayerOne' : 'matchPlayerTwo'

		let right = games[roomId].matchBoardGrid[playerIndex + 1]
		let left = games[roomId].matchBoardGrid[playerIndex - 1]
		let up = games[roomId].matchBoardGrid[playerIndex + 10]
		let down = games[roomId].matchBoardGrid[playerIndex - 10]
		let downLeft = games[roomId].matchBoardGrid[playerIndex - 10 - 1]
		let downRight = games[roomId].matchBoardGrid[playerIndex - 10 + 1]
		let upRight  = games[roomId].matchBoardGrid[playerIndex + 10 + 1]
		let upLeft  = games[roomId].matchBoardGrid[playerIndex + 10 - 1]

		let damage = 10

		if(type === 'cross') {

			if(right === 25) {
				console.log('there is a wall here')
			} else if ((playerIndex + 1)%10 === 0) {
				console.log('this is off the grid!')
			} else if (right === 1 || right === 100) {
				handleLivesAmount(player, damage)
			} else {
				games[roomId][currentPlayer].meleeAttackTiles.push(playerIndex + 1)
				games[roomId][currentPlayer].meleeTempTiles.push(0)
			}

			if(left === 25) {
				console.log('there is a wall here')
			} else if ((playerIndex + 1)%10 === 1) {
				console.log('this is off the grid!')
			} else if (left === 1 || left === 100) {
				handleLivesAmount(player, damage)
			} else {
				games[roomId][currentPlayer].meleeAttackTiles.push(playerIndex - 1)
				games[roomId][currentPlayer].meleeTempTiles.push(0)
			}

			if(up === 25) {
				console.log('there is a wall here')
			} else if ((playerIndex + 10) < 0 || (playerIndex + 10) > 99 ) {
				console.log('this is off the grid!')
			} else if (up === 1 || up === 100) {
				handleLivesAmount(player, damage)
			} else {
				games[roomId][currentPlayer].meleeAttackTiles.push(playerIndex + 10)
				games[roomId][currentPlayer].meleeTempTiles.push(0)
			}

			if(down === 25){
				console.log('there is a wall here')
			} else if ((playerIndex - 10) < 0 || (playerIndex - 10) > 99 ) {
				console.log('this is off the grid!')
			} else if (down === 1 || down === 100) {
				handleLivesAmount(player, damage)
			} else {
				games[roomId][currentPlayer].meleeAttackTiles.push(playerIndex - 10)
				games[roomId][currentPlayer].meleeTempTiles.push(0)
			}

		} else if (type === 'x') {

			if(downRight === 25) {
				console.log('there is a wall here')
			} else if ((playerIndex - 10 + 1) < 0 || (playerIndex - 10 + 1) > 99 ) {
				console.log('this is off the grid!')
			} else if ((playerIndex + 1)%10 === 0) {
				console.log('this is off the grid!')
			} else if (downRight === 1 || downRight === 100) {
				handleLivesAmount(player, damage)
			} else {
				games[roomId][currentPlayer].meleeAttackTiles.push(playerIndex - 10 + 1)
				games[roomId][currentPlayer].meleeTempTiles.push(0)
			}

			if(downLeft === 25) {
				console.log('there is a wall here')
			} else if ((playerIndex - 10 - 1) < 0 || (playerIndex - 10 - 1) > 99 ) {
				console.log('this is off the grid!')
			} else if ((playerIndex + 1)%10 === 1) {
				console.log('this is off the grid!')
			} else if (downLeft === 1 || downLeft === 100) {
				handleLivesAmount(player, damage)
			} else {
				games[roomId][currentPlayer].meleeAttackTiles.push(playerIndex - 10 - 1)
				games[roomId][currentPlayer].meleeTempTiles.push(0)
			}

			if(upLeft === 25) {
				console.log('there is a wall here')
			} else if ((playerIndex + 10 - 1) < 0 || (playerIndex + 10 - 1) > 99 ) {
				console.log('this is off the grid!')
			} else if ((playerIndex + 1)%10 === 1) {
				console.log('this is off the grid!')
			} else if (upLeft === 1 || upLeft === 100) {
				handleLivesAmount(player, damage)
			} else {
				games[roomId][currentPlayer].meleeAttackTiles.push(playerIndex + 10 - 1)
				games[roomId][currentPlayer].meleeTempTiles.push(0)
			}

			if(upRight === 25){
				console.log('there is a wall here')
			} else if ((playerIndex + 10 + 1) < 0 || (playerIndex + 10 + 1) > 99 ) {
				console.log('this is off the grid!')
			} else if ((playerIndex + 1)%10 === 0) {
				console.log('this is off the grid!')
			} else if (upRight === 1 || upRight === 100) {
				handleLivesAmount(player, damage)
			} else {
				games[roomId][currentPlayer].meleeAttackTiles.push(playerIndex + 10 + 1)
				games[roomId][currentPlayer].meleeTempTiles.push(0)
			}

		}
	}

	async function assignAttackTiles(direction, enemy) {
		let matchPlayer = enemy ? 'matchPlayerTwo' : 'matchPlayerOne'

		games[roomId][matchPlayer].attackTiles.forEach((attackTile,index) =>{
			games[roomId].matchBoardGrid[attackTile] = direction === 'horizontal' ? 10 : 11
		})
	}

	async function assignMeleeTiles(player) {
		let currentPlayer  = player === 1 ? 'matchPlayerOne' : 'matchPlayerTwo'

		games[roomId][currentPlayer].meleeAttackTiles.forEach((meleeTile,index) =>{
			games[roomId].matchBoardGrid[meleeTile] = 12
		})
	}

	async function resetMeleeTiles(player) {
		let currentPlayer = player === 1 ? 'matchPlayerOne' : 'matchPlayerTwo'

		console.log('resetting melee attack', games[roomId][currentPlayer].meleeTempTiles)

		games[roomId][currentPlayer].meleeAttackTiles.forEach((value, index) => {
			if(games[roomId].matchBoardGrid[value] === 10){
				games[roomId].matchBoardGrid[value] = 10;
			} else if ( games[roomId].matchBoardGrid[value] === 11){
				games[roomId].matchBoardGrid[value] = 11;
			} else {
				games[roomId].matchBoardGrid[value] = games[roomId][currentPlayer].meleeTempTiles[index]
			}
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

	const meleeAttackCoolDown = (player) => {
		games[roomId].clientMeleeAttacks.shift()

		console.log(player, 'we are cooling down', process.uptime(), games[roomId].clientMeleeAttacks, games[roomId].matchPlayerOne.meleeTempTiles)

		setTimeout(() => {
			resetMeleeTiles(player).then(() => {
				let matchPlayer = player === 1 ? 'matchPlayerOne' : 'matchPlayerTwo'

				games[roomId][matchPlayer].meleeTempTiles = [];
				games[roomId][matchPlayer].meleeAttackTiles = [];
			})
		}, 500)

		setTimeout(() => {
			console.log(games[roomId].matchPlayerOne.status)

			if(player === 1){
				console.log(games[roomId].matchPlayerOne.status)
				if(games[roomId].matchPlayerOne.status === 'charging'){
					console.log('this is happening')
					return games[roomId].matchPlayerOne.status = 'charging'
				} else {
					console.log('this is also happening wtf')
					return games[roomId].matchPlayerOne.status = 'normal'
				}
			} else if (player === 100){
				if(games[roomId].matchPlayerTwo.status === 'charging'){
					return games[roomId].matchPlayerTwo.status = 'charging'
				} else {
					return games[roomId].matchPlayerTwo.status = 'normal'
				}
			}

			games[roomId].clientMeleeAttacks.shift()
			//player attack ends here
			console.log('player melee attack ended', games[roomId].clientMeleeAttacks)
		}, 500)
	}

	/**
	 * Handles player lives
	 */
	const handleLivesAmount = (player, lifeAmount) => {
		let characterTakingDamage = player === 1 ? 'matchPlayerTwo' : 'matchPlayerOne'

		games[roomId][characterTakingDamage].lives = games[roomId][characterTakingDamage].lives - lifeAmount
	}

	const handleLivesAmountRegular = (player) => {
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
				let boardCopy = [...maps[map]];

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
						meleeAttackTiles: [],
						meleeTempTiles: [],
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
						meleeAttackTiles: [],
						meleeTempTiles: [],
						lives: 50,
						buttonPressed: 'up',
					},
					matchBoardGrid: boardCopy,
					matchRoomId: roomId,
					matchCurrentNumberOfUsers: 2,
					matchRematchCount: 0,
					serverPhysicsTickInterval: undefined,
					serverUpdateTickInterval: undefined,
					tick: true,
					clientInputs: [],
					clientStatusChanges: [],
					clientPlayerAttacks: [],
					clientMeleeAttacks: [],
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

			console.log('sending to restart game!', games[roomId].matchBoardGrid)
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
	console.log(`listening on http://localhost:${PORT}`)
})

