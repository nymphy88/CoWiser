
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Room state storage (in-memory for this demo)
  const rooms = new Map<string, { summary: string; users: Set<string> }>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { summary: "", users: new Set() });
      }
      
      const room = rooms.get(roomId)!;
      room.users.add(socket.id);
      
      // Send current state to the new user
      socket.emit("init-state", { summary: room.summary, userCount: room.users.size });
      
      // Notify others
      socket.to(roomId).emit("user-joined", { userCount: room.users.size });
      
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("update-summary", ({ roomId, summary }: { roomId: string; summary: string }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.summary = summary;
        // Broadcast to everyone else in the room
        socket.to(roomId).emit("summary-updated", summary);
      }
    });

    socket.on("disconnecting", () => {
      for (const roomId of socket.rooms) {
        const room = rooms.get(roomId);
        if (room) {
          room.users.delete(socket.id);
          socket.to(roomId).emit("user-left", { userCount: room.users.size });
          
          if (room.users.size === 0) {
            // Optionally clean up empty rooms after some time
          }
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
