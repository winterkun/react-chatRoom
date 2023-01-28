const { createServer } = require('http');
const { Server } = require('socket.io');

var httpServer = createServer();

var io = new Server(httpServer, {
    path: "/websocket",
    cors: {
      rogin: ["http://localhost:3000"],
      allowedHeaders: [],
      credentials: true,
    },
});

io.on('connection', function(socket) {
    
    socket.on('message', function(msg, callback) {
        console.log('msg', msg);
        callback(msg);
    });

    socket.on('chat:start', function(id, callback) {
        io.sockets.emit('chat:add', {
            [id]: `用户${id}已经上线了`
        });
        callback();
    });

    socket.on('chat:msg', function(id, msg) {
        io.sockets.emit('chat:msg', {
            id,
            msg: `${id}说：${msg}`
        })
    })
})



httpServer.listen(808, () => {
    console.log('server is running in 808')
})