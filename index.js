const cors = require("cors");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();

// Use the cors middleware for Express directly
app.use(cors({
    origin: "https://peermeet.onrender.com",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
}));
try {
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "https://peermeet.onrender.com",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    const nameToSocketIdMap = new Map();
    const socketIdToNameMap = new Map();
    const rooms = new Map();

    io.on("connection", (socket) => {
        console.log("socket connected", socket.id);

        socket.on("room:join", ({ user, roomId }) => {
            console.log(`User ${user} joined room ${roomId}`);
            const userName = user;
            const userRoomId = roomId;
            console.log(userName);

            // Corrected: Join the socket to the room before emitting events
            socket.join(userRoomId);
                     // Get or initialize the room data
                     let room = rooms.get(userRoomId);
                     if (!room) {
                         room = { host: null, joinnee: null };
                         rooms.set(userRoomId, room);
                     }
         
                     // Assign roles based on existing users in the room
                     if (!room.host) {
                         room.host = socket.id;
                     } else if (!room.joinnee) {
                         room.joinnee = socket.id;
                     }

              // Emit events after joining the room
        io.to(userRoomId).emit("user:joined", { username: userName, id: socket.id, roomId: roomId });
        io.to(socket.id).emit("room:join", { username: userName, roomId });

        console.log("Room Data:", room);
    });

        socket.on('user:call', ({ to, offer }) => {
            io.to(to).emit('incoming:call', { from: socket.id, offer });
        });

        socket.on('call:accepted', ({ to, ans }) => {
            io.to(to).emit('call:accepted', { from: socket.id, ans });
        });

        socket.on('peer:nego:needed', ({ to, offer }) => {
            io.to(to).emit('peer:nego:needed', { from: socket.id, offer });
        });

        socket.on('peer:nego:done', ({ to, ans }) => {
            io.to(to).emit('peer:nego:final', { from: socket.id, ans });
        });
    });

    const PORT = 8000;
    httpServer.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
} catch (error) {
    console.error("Error setting up Socket.IO server:", error);
}
