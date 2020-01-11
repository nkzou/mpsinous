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
var others = {}

function drawCircle(circle) {
    ctx.beginPath();
    ctx.arc(circle.posx, circle.posy, circle.rad, 0, 2 * Math.PI);
    ctx.fillStyle = circle.color
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    var toclear = []
    for (var i = 0; i < obj.length; i++) {
        drawCircle(obj[i])
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
            drawCircle(new Circle({
                x: others[key].x,
                y: others[key].y
            }, 5, "#00FF00", 0))
        }
    }
}

function initialize() {
    return setInterval(draw, 5)
}

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
initialize()
