
var field = document.getElementById('myField');
var enemy = document.getElementById('myEnemy');
var contextField = field.getContext('2d');
var contextEnemy = enemy.getContext('2d');
var ships = document.getElementsByTagName('img');
var buttonStart = document.getElementById('beginGame');
var msgs = document.getElementById('messages');
var x = document.createElement("img");
x.src = "/img/explosion.png";

var widthCanvas = field.width;
var heightCanvas = field.height;
var numRowCol = 10;
var width = widthCanvas/numRowCol;
var height = heightCanvas/numRowCol;
var hit = 0;
var coordinates = [];
var numShips = 0;
var flag = false;
var horizontal = false;


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
enemy.addEventListener('mouseover',function(e){
	//log(e.target);
	//log(flag);
	if (flag) {
		e.target.style.cursor = "crosshair";
	}else{
		e.target.style.cursor = 'not-allowed';
	}
});
 
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
		//ships[i].addEventListener("click", rotateShip, false);
		/*ships[i].addEventListener("dragend", function(e){
			e.target.style.visibility = 'hidden';
		});*/
	}	
}

function moveShip(e){
	var data = {imgId: e.target.id, coordX: e.offsetX, coordY: e.offsetY, 
				width: e.target.width, height: e.target.height};
	log("width" + data.width);
	log("height" + data.height);
	log("corrx"+data.coordX);
	log("corry"+data.coordY);
	e.dataTransfer.setData("data", JSON.stringify(data));
}

function drop(e){
	e.preventDefault();
    var data = e.dataTransfer.getData("data");
    var data = JSON.parse(data);
    img = document.getElementById(data.imgId);
    var x = e.layerX - data.coordX;
    var y = e.layerY - data.coordY;
    var coordImage = getCoordforDraw(x,y,data.width,data.height);
    var lastCoordy = coordImage.y + data.height;
    for (var i = coordImage.y; i < lastCoordy; i+=height) {
    	coordinates.push({x: coordImage.x, y:i});
    }
    numShips ++;
    img.style.visibility = 'hidden';
    log(numShips);
    contextField.drawImage(img, coordImage.x , coordImage.y, data.width, data.height);;
}

function allowDrop(e){
	e.preventDefault();
}

function rotateShip(e){
	log(horizontal);
	var angle;
	if(!horizontal){
		angle = 270;
		horizontal = true;
	}else{
		angle = 0;
		horizontal = false;
	}
	
	var img = e.target;
	log(img);
	var width = img.width;
	var height = img.height;
	log(width);
	log(height);
	var jimg = $(img);
	//log(imgModify);
	jimg.css({ 
        '-webkit-transform': 'rotate(' + angle + 'deg)',
        '-moz-transform': 'rotate(' + angle + 'deg)',
        'transform': 'rotate(' + angle + 'deg)' 
    });
    jimg.width = height;
    jimg.height = width;
}


function getCoordforDraw(x,y,width,height){	
    var difx = x % width;
    var dify = y % width;

    if(difx <= width / 2){
    	x -= difx;
    }else{
    	x += (width - difx);
    }

    if(dify <= height / 2){
    	y -= dify;
    }else{
    	y += (height - dify);
    }
    //log(y);
    if((x + width) > widthCanvas){
    	x = widthCanvas - width; 
    }
    if((y + height) > heightCanvas){
    	y = heightCanvas - height; 
    }

    var coordDraw = {x:x,y:y};
    return coordDraw;
}


log('Empieza a crear socket');

socket.on('connect', function (m) { 
	// llama la funciòn del lado del servidor 'addPlayer' y envia un parametro que es el valor del prompt
	socket.emit('addPlayer', user);

});

socket.on('forceDisconnection',function(){
	socket.disconnect();
	alert('me han desconectado')
});

socket.on('wait',function(data){
	renderMessage("notify-info", data.msg);
});

function beginBatle(){
	if(numShips==5){
		socket.emit('ready',user);
		buttonStart.disabled = "true";
	}
	else{
		renderMessage("notify-warning", "Añade todos los barcos a tu campo de batalla");
	}
	
}

socket.on('flag',function(data){
	renderMessage("notify-info", data.msg);
	flag = data.flag;
});

socket.on('start',function(data){
	renderMessage("notify-info", data.msg);
	enemy.addEventListener('click',shoot);
});

socket.on('updatField', function (username, data) {
	//msgs.innerHTML += '<b>' + username + ':</b> ' + data + '<br>';
	var msg = username + data;
	renderMessage("notify-info", msg);
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
		renderMessage("notify-warning", "Espera tu turno");
	}
	
}

socket.on('receiveShoot',function(coord){
	var isHit = isShootCorrect(coord);
	//log(isHit);
	//log(user);
	socket.emit('success',{success: isHit, user: user, coord: coord});
	if(isHit){
		renderMessage("notify-info","Viejo, te han dado");
		contextField.drawImage(x,coord.coorX,coord.coorY,width,height);
		hit += 1;
		log(hit);
		if(hit == 16){
			socket.emit('win',{user:user});
		}
	}
	else{
		renderMessage("notify-info","Te salvaste esta vez");
		contextField.fillStyle="#BCB5B5";
		contextField.fillRect(coord.coorX,coord.coorY,width,height);
	}
	flag = true;

});

socket.on('goodShot', function(data){
	contextEnemy.fillStyle="#0E2BCB";
	contextEnemy.fillRect(data.coord.coorX, data.coord.coorY , width, height);
	var msg = data.msg + " a " + data.user;
	renderMessage("notify-info",msg);
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

function renderMessage(type, msg){
	msgs.className = type;
	msgs.innerHTML = msg;
}

socket.on('winner',function(data){
	renderMessage("notify-success",data.msg);
});

socket.on('loser',function(data){
	renderMessage("notify-info", data.msg);
});


socket.on('connect_error', function (m) { 
	log("error"); 
});

socket.on('message', function (m) { 
	log(m); 
});

