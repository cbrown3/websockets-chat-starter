const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html'});
    response.write(index);
    response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

// pass in the htttp server into socketio and grab the websocket server as io
const io = socketio(app);

// object to hold all of our connected users
const users = [];

const onJoined = (sock) => {
    const socket = sock;
    
    socket.on('join', (data) => {
        //message back to new user
        const joinMsg = {
            name: 'server',
            msg: `There are ${Object.keys(users).length} users online`,
        };
        
        socket.name = data.name;
        socket.emit('msg', joinMsg);
        
        socket.join('room1');
        
        //announcement to everyone in the room
        const response = {
            name: 'server',
            msg: `${data.name} has joined the room.`,
        };
        socket.broadcast.to('room1').emit('msg', response);
        
        console.log(`${data.name} joined`);
        //success message back to new user
        socket.emit('msg', {name: 'server', msg: 'You joined the room'});
        
        users.push(sock); 
        
        //message of update to how many users there are
        const joinMsg2 = {
            name: 'server',
            msg: `There are ${Object.keys(users).length} users online`,
        };
        
        socket.broadcast.to('room1').emit('msg', joinMsg2);
        
    });
};

const onMsg = (sock) => {
    const socket = sock;
    
    socket.on('msgToServer', (data) => {
        console.dir(data);
        io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
        
        if(data.msg.includes('change username to ')){
            socket.name = data.msg.substr(19);
        }
        
    });
};

const onDisconnect = (sock) => {
     sock.on('disconnect', () => {
    
        const leaveMsg = {
            name: 'server',
            msg: `${sock.name} has left the room.`,
        };

        sock.broadcast.to('room1').emit('msg', leaveMsg);

        sock.leave('room1');
        
        const userIndex = users.indexOf(sock.name);
         
        users.splice(userIndex, 1);
         
        });
};

io.sockets.on('connection', (socket) => {
    console.log('started');
    
    onJoined(socket);
    onMsg(socket);
    onDisconnect(socket);

});

console.log('Websocket server started');