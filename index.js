const cors = require("cors");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();

try {
    const corsOptions = {
        origin: "https://peermeet.onrender.com",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
    };

    app.use(cors(corsOptions));

    const httpServer = createServer(app);
    const io = new Server(httpServer);

    const nameToSocketIdMap = new Map();
    const socketIdToNameMap = new Map();

    io.on("connection", (socket) => {
        console.log("socket connected", socket.id);

        socket.on("room:join", ({ user, roomId }) => {
            console.log(`User ${user} joined room ${roomId}`);
            const userName = user;
            const userRoomId = roomId;
            console.log(userName);
        
            // Corrected: Join the socket to the room before emitting events
            socket.join(userRoomId);
        
            nameToSocketIdMap.set(userName, socket.id);
            socketIdToNameMap.set(socket.id, userName);
        
            // Emit events after joining the room
            io.to(userRoomId).emit("user:joined", { username: userName, id: socket.id });
            io.to(socket.id).emit("room:join", { username: userName, roomId });
        });
        
  
        socket.on('user:call', ({ to, offer }) => {
            io.to(to).emit('incoming:call', { from: socket.id, offer });
        });

        socket.on('call:accepted', ({ to, ans }) => {
            io.to(to).emit('call:accepted', { from: socket.id, ans });
        });
        
        socket.on('peer:nego:needed', ({ to, offer }) => {
            io.to(to).emit('peer:nego:needed', { from: socket.id, offer});
        });

        socket.on('peer:nego:done', ({ to, ans}) => {
            io.to(to).emit('peer:nego:final', { from: socket.id, ans});
        });
    });

    const PORT = 8000;
    httpServer.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
} catch (error) {
    console.error("Error setting up Socket.IO server:", error);
}
