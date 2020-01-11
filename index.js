var express = require("express")
var app = express()
var http = require("http").Server(app)
var io = require("socket.io")(http)

var sqlite3 = require("sqlite3")
var db = new sqlite3.Database('Wins.db');
db.run("CREATE TABLE IF NOT EXISTS winners (name TEXT, time INT)");

var plist = {}
var interval = 120
var active = false
var base = 0
var start = 0

app.get('/', function(req, res) {
    if (!active) {
        res.sendFile(__dirname + "/game.html")
    }
    else {
        res.sendFile(__dirname + "/lock.html")
    }
})
app.get('/script.js', function(req, res) {
    if (!active) {
        res.sendFile(__dirname + "/player.js")
    }
    else{
        res.sendFile(__dirname + "/spectator.js")
    }
})
app.get('/style.css', function(req, res) {
    res.sendFile(__dirname + "/style.css")
})
app.get('/score/', function(req, res) {
    res.sendFile(__dirname+"/score.html")
})
app.get('/score/style.css', function(req, res) {
    res.sendFile(__dirname+"/style.css")
})
app.get('/score/score.js', function(req, res) {
    res.sendFile(__dirname+"/score.js")
})
io.on("connection", function(socket) {
    socket.emit("sSendId", socket.id)
    socket.on("cJoinGame", function(data) {
        plist[socket.id] = {
            x: -10,
            y: -10
        }
        if (!active && Object.keys(plist).length >= 2) {
            start = new Date().getTime() / 1000;
            interval = 120
            base = 0
            active = true
            io.emit("sStartGame")
            setTimeout(sendObs, interval)
        }
    })

    socket.on("cPlayerPos", function(data) {
        if (!Object.keys(plist).length == 0 && plist[socket.id]) {
            plist[socket.id].x = data.x
            plist[socket.id].y = data.y
            io.emit("sPlayerPos", plist)
        }
    })
    socket.on("cPlayerDeath", function() {
        var temp = plist[socket.id]
        delete plist[socket.id]
        if (Object.keys(plist).length < 1) {
            active = false
            db.run("INSERT INTO winners (name, time) VALUES (?,?)", [temp.user, ((new Date().getTime() / 1000) - start)])
            plist = {}
        }
        io.emit("sPlayerDeath", socket.id)
    })
    socket.on("disconnect", function() {
        delete plist[socket.id]
        io.emit("sPlayerDeath", socket.id)
        if (Object.keys(plist).length < 1) {
            active = false
            plist = {}
        }
    })
    socket.on("cGetLeaders", function(){
        var winners = ""
        db.each("SELECT name, time FROM winners ORDER BY time DESC", function(err, row) {
            var str = row.name+"— <span style=\"color:#00FF00;\">"+Math.round(row.time * 10) / 10+"</span>s<br>"
            winners = winners + str
        }, function(err, row){
            io.emit("sLeaders", winners)
        })
    })
    socket.on("cUsername", function(data){
        plist[socket.id].user = data
    })
})

function sendObs() {
    if (!active) {
        return
    }
    io.emit('sNewObstacle', {
        x: Math.floor(Math.random() * 1280),
        rad: 3 + Math.floor(Math.random() * 2),
        spd: Math.floor(base / 25 + Math.random() * 5)
    })
    if (Math.random() < .15 && interval > 20) {
        interval--
        base++
    }
    setTimeout(sendObs, interval)
}
http.listen(process.env.PORT, process.env.IP, function() {
    console.log("MPS Ready")
})