const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" },
});

app.use(cors());
app.use(express.static("uploads"));

const rooms = {};

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    if (rooms[roomId]) {
      socket.emit("videoUploaded", rooms[roomId]);
    }
  });

  socket.on("videoUploaded", (videoPath, roomId) => {
    rooms[roomId] = videoPath;
    io.to(roomId).emit("videoUploaded", videoPath);
  });

  socket.on("videoAction", ({ roomId, action, time }) => {
    io.to(roomId).emit("videoState", { action, time });
  });
});

app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const videoPath = `http://localhost:5000/${req.file.filename}`;
  res.json({ success: true, videoPath });
});

server.listen(5000, () => console.log("Server running on port 5000"));
