var l = document.getElementById('l');
var log = function (m) {
    var i = document.createElement('li');
    i.innerText = new Date().toISOString()+' '+m;
    l.appendChild(i);
}
log('opening websocket connection');
var s = new WebSocket('ws://'+window.location.host+'/');
s.addEventListener('error', function (m) { log("error"); });
s.addEventListener('open', function (m) { log("websocket connection open"); });
s.addEventListener('message', function (m) { log(m.data); });