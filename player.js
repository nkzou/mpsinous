/*global $,io*/
"use strict";
class Circle {
    constructor(position, size, color, spd) {
        this.posx = position.x
        this.posy = position.y
        this.rad = size
        this.color = color
        this.speed = spd
    }
    move() {
        //this.posx -= this.speed*2
        this.posy += this.speed
        if (this.posy > 725) {
            return false
        }
        return true
    }
}

var socket = io()
var canvas = document.getElementById("game");

var ctx = canvas.getContext("2d")
ctx.textAlign = "center"
ctx.font = "30px Roboto";

var obj = []
var player = new Circle({
    x: -10,
    y: -10
}, 5, "#00FFFF", 0)
var others = {}

var name = "DEBUG"
var alive = true
var gs = false

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    player.posx = Math.floor(evt.clientX - rect.left)
    player.posy = Math.floor(evt.clientY - rect.top)
    return {
        x: player.posx,
        y: player.posy
    };
}

function drawCircle(circle) {
    ctx.beginPath();
    ctx.arc(circle.posx, circle.posy, circle.rad, 0, 2 * Math.PI);
    ctx.fillStyle = circle.color
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!alive) {
        ctx.fillStyle = "#FF0000"
        ctx.fillText("You have died.", 640, 360);
    }
    if (gs) {
        ctx.fillStyle = "#00FF00"
        ctx.fillText("Game Start!", 640, 360);
    }
    drawCircle(player)
    var toclear = []
    for (var i = 0; i < obj.length; i++) {
        drawCircle(obj[i])
        if (Math.hypot(obj[i].posx - player.posx, obj[i].posy - player.posy) < obj[i].rad + 5) {
            socket.emit("cPlayerDeath")
            alive = false
            player.posx = -5
            player.posy = -5
        }
        if (!obj[i].move()) {
            toclear.push(i)
        }
    }
    var offset = 0
    for (var i = 0; i < toclear.length; i++) {
        obj.splice(toclear[i] - offset, 1);
        offset++
    }
    for (var key in others) {
        if (others.hasOwnProperty(key)) {
            if (key != name) {
                drawCircle(new Circle({
                    x: others[key].x,
                    y: others[key].y
                }, 5, "#00FF00", 0))
            }
        }
    }
}

function initialize() {
    socket.emit("cJoinGame")
    return setInterval(draw, 5)
}

canvas.addEventListener('mousemove', function(evt) {
    if (alive) {
        socket.emit("cPlayerPos", getMousePos(canvas, evt))
    }
}, false);

socket.on("sSendId", function(data) {
    name = data
})
socket.on("sNewObstacle", function(data) {
    var newobj = new Circle({
        x: data.x,
        y: -20,
    }, data.rad, "#FF0000", data.spd)
    obj.push(newobj)
})
socket.on("sPlayerPos", function(data) {
    others = data
})
socket.on("sPlayerDeath", function(id) {
    delete others[id]
})
socket.on("sStartGame", function() {
    gs = true
    setTimeout(function() {
        gs = false
    }, 2000)
})
$('#userinput').on("keyup", function(e) {
    if (e.keyCode == 13) {
        document.getElementById("userinput").disabled = (document.getElementById("userinput").value.length > 0);
        if(document.getElementById("userinput").disabled){
            initialize()
            socket.emit("cUsername", e.target.value)
        }
    }
    
})

