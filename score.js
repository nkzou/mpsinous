/*global $,io*/

var socket = io()

function initialize() {
    socket.emit('cGetLeaders')
}

socket.on("sLeaders", function(data) {
    $("#leads").html(data)
})
initialize()
