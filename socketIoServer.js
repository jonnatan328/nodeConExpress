var path = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var bootstrap = require('bootstrap');

app.use(express.static("public"));

app.get('/', (req, res) => {
  //console.error('express connection');
  res.sendFile(path.join(__dirname, 'public/socketIoClient.html'));
});

var players = {};
var numPlayers = 0;
var ready = 0;


io.on('connection', socket => {
	var countPlayers = Object.keys(players).length;
	  	console.error('socket.io connection');
		// when the client emits 'adduser', this listens and executes
		socket.on('addPlayer', function(username){
			//if(numPlayers < 2){
				console.log(socket.id);
				players[username] = socket.id;
				console.log(players[username]);
				numPlayers ++;
				console.log(numPlayers);
				// echo to client they've connected
				socket.emit('updatField', 'SERVER: ', username + ' te has conectado al campo de batalla');
				// echo that a person has connected 
				socket.broadcast.emit('updatField', 'SERVER: ', username + ' Se ha unido a la batalla');
			/*}
			else{
				socket.emit('forceDisconnection');
			}*/			
			
			
		});

		socket.on('shoot', function(data){
			socket.broadcast.emit('receiveShoot', data);
		});

		socket.on('ready',function(user){
			ready ++;
			if(ready!=2){
				socket.emit('wait',{msg: 'Espera a que este listo tu enemigo...'});
			}
			else{
				io.emit('start',{msg: 'Que empiece la batalla'});
				socket.broadcast.emit('flag',{flag:true, msg:'Tienes el primer turno'});
			}
		});

		socket.on('success', function(data){
			if(data.success){
				socket.broadcast.emit('goodShot',{user: data.user, msg: 'Le has dado', coord:data.coord})
			}
		});

		socket.on('win', function(data){
			socket.broadcast.emit('winner',{msg: '¡Fabuloso, has ganado la batalla!'});
			socket.emit('loser',{msg: 'Perdiste amigo, ¡Te han dado en la madre!'});
			
		});
});


http.listen(3002, () => console.error('listening on http://localhost:3002/'));