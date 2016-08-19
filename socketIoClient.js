var l = document.getElementById('l');
var log = function (m) {
    var i = document.createElement('li');
    i.innerText = new Date().toISOString()+' '+m;
    l.appendChild(i);
}
log('opening socket.io connection');
var s = io();
s.on('connect_error', function (m) { log("error"); });
s.on('connect', function (m) { log("socket.io connection open"); });
s.on('message', function (m) { log(m); });