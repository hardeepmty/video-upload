const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.static("uploads"));

const rooms = {}; // Store users per room

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ roomId, userName }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(userName);
    socket.join(roomId);

    io.to(roomId).emit("userList", rooms[roomId]);

    socket.on("disconnect", () => {
      rooms[roomId] = rooms[roomId].filter((name) => name !== userName);
      io.to(roomId).emit("userList", rooms[roomId]);
    });
  });

  socket.on("videoAction", ({ roomId, action, time }) => {
    socket.to(roomId).emit("videoState", { action, time });
  });

  socket.on("videoUploaded", ({ videoPath, roomId }) => {
    io.to(roomId).emit("videoUploaded", videoPath);
  });
});

// Set up Multer storage with file size limit
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB max
});

app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const videoPath = `http://localhost:5000/${req.file.filename}`;
  res.json({ success: true, videoPath });
});

// Handle video streaming with Content-Range
app.get("/video/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    });
    file.pipe(res);
  } else {
    res.writeHead(200, { "Content-Length": fileSize, "Content-Type": "video/mp4" });
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(5000, () => console.log("Server running on port 5000"));
