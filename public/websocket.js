
var field = document.getElementById('myField');
var enemy = document.getElementById('myEnemy');
var contextField = field.getContext('2d');
var contextEnemy = enemy.getContext('2d');
var ships = document.getElementsByTagName('img');
var droptarget = document.getElementById('droptarget');
var buttonStart = document.getElementById('beginGame');
var x = document.createElement("img");
x.src = "/img/x.jpg";

var widthCanvas = field.width;
var heightCanvas = field.height;
var numRowCol = 10;
var width = widthCanvas/numRowCol;
var height = heightCanvas/numRowCol;
var hit = 0;
var coordinates = [];
var numShips = 0;
var flag = false;



var log = function (m) {
    console.log(m);
}

var user = prompt("Ingrese el nombre de tu equipo");
document.getElementById('me').innerHTML += '<h2>' + user + '</h2> ';

var socket = io();

drawFields();
addShips();
field.addEventListener('drop',drop);
field.addEventListener('dragover',allowDrop);
buttonStart.addEventListener('click',beginBatle);
 
function drawFields(){
	var x = width;
	var y = height;
	while(y < heightCanvas && x < widthCanvas){
		contextField.moveTo(x,0);
	  	contextField.lineTo(x,400);
	  	contextField.moveTo(0,y);
	  	contextField.lineTo(400,y);
	  	contextEnemy.moveTo(x,0);
	  	contextEnemy.lineTo(x,400);
	  	contextEnemy.moveTo(0,y);
	  	contextEnemy.lineTo(400,y);
	  	x += width;
  	y += height;
	}
	contextField.stroke();
	contextEnemy.stroke();
}

function addShips(){
	var length = ships.length;
	for (var i = 0; i < length ; i++) {
		ships[i].addEventListener("dragstart", moveShip, false);
		ships[i].addEventListener("dragend", function(e){
			e.target.style.visibility = 'hidden';
		});
	}	
}

function moveShip(e){
	var data = {imgId: e.target.id,coordX: e.offsetX,coordY: e.offsetY, width: e.target.width, height: e.target.height};
	e.dataTransfer.setData("data", JSON.stringify(data));
}

function drop(e){
	e.preventDefault();
    var data = e.dataTransfer.getData("data");
    var data = JSON.parse(data);
    img = document.getElementById(data.imgId);
    var x = e.layerX - data.coordX;
    var y = e.layerY - data.coordY;
    var coordImage = getCoordforDraw(x,y);
    var lastCoordy = coordImage.y + data.height;
    for (var i = coordImage.y; i < lastCoordy; i+=height) {
    	coordinates.push({x: coordImage.x, y:i});
    }
    numShips ++;
    contextField.drawImage(img, coordImage.x , coordImage.y, data.width, data.height);;
}

function getCoordforDraw(x,y){	
    var difx = x % width;
    var dify = y % width;
    if(difx <= width / 2){
    	x -= difx;
    }
    else{
    	x += (width - difx);
    }
    if(dify <= width / 2){
    	y -= dify;
    }
    else{
    	y += (width - dify);
    }
    var coordDraw = {x:x,y:y};
    return coordDraw;
}


function allowDrop(e){
	e.preventDefault();
}


log('Empieza a crear socket');

socket.on('connect', function (m) { 
	// call the server-side function 'adduser' and send one parameter (value of prompt)
	socket.emit('addPlayer', user);

});

socket.on('forceDisconnection',function(){
	socket.disconnect();
	alert('me han desconectado')
});

socket.on('wait',function(msg){
	alert(msg.msg);
});


function beginBatle(){
	if(numShips==5){
		socket.emit('ready',user);
		buttonStart.disable = "true";
	}
	else{
		alert('Añade todos tus barcos al campo de batalla')
	}
	
}

socket.on('flag',function(data){
	flag = data.flag;
	alert(data.msg);
});

socket.on('start',function(msg){
	alert(msg.msg);
	enemy.addEventListener('click',shoot);
});

socket.on('updatField', function (username, data) {
	var welcome = document.getElementById('conversation');
	welcome.innerHTML += '<b>' + username + ':</b> ' + data + '<br>';
});

function shoot(e){
	if(flag){
		var data = {coorX: e.layerX, coorY: e.layerY};
		var difx = data.coorX % width;
		var dify = data.coorY % width;
		var x = data.coorX - difx;
		var y = data.coorY - dify;
		contextEnemy.fillStyle="#BCB5B5";
		contextEnemy.fillRect(x, y , width, height);
		var coordenadas = {coorX: x, coorY: y};
		socket.emit('shoot',coordenadas);
		flag = false;
	}
	else{
		alert('Espera tu turno');
	}
	
}

socket.on('receiveShoot',function(coord){
	var isHit = isShootCorrect(coord);
	log(isHit);
	//log(user);
	socket.emit('success',{success: isHit, user: user, coord: coord});
	if(isHit){
		contextField.drawImage(x,coord.coorX,coord.coorY,width,height);
		hit += 1;
		if(hit == coordinates.length){
			socket.emit('win',{user:user});
		}
	}
	else{
		contextField.fillStyle="#BCB5B5";
		contextField.fillRect(coord.coorX,coord.coorY,width,height);
	}
	flag = true;

});

socket.on('goodShot', function(data){
	contextEnemy.fillStyle="#0E2BCB";
	contextEnemy.fillRect(data.coord.coorX, data.coord.coorY , width, height);
	alert(data.msg + " a " + data.user);
});

function isShootCorrect(coord){
	var bool = false;
	for (var i = 0; i < coordinates.length; i++) {
		if (coordinates[i].x == coord.coorX && coordinates[i].y == coord.coorY) {
			bool = true; 
		}
	}
	return bool;
}

socket.on('winner',function(data){
	alert(data.msg)
});

socket.on('loser',function(data){
	alert(data.msg)
});

socket.on('connect_error', function (m) { 
	log("error"); 
});

socket.on('message', function (m) { 
	log(m); 
});

