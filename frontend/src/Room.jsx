import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000");

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const userName = queryParams.get("name"); // Get name from URL

  const [videoURL, setVideoURL] = useState("");
  const [users, setUsers] = useState([]); // Store list of users
  const videoRef = useRef(null);
  const isRemoteEvent = useRef(false);

  useEffect(() => {
    if (userName) {
      socket.emit("joinRoom", { roomId, userName });
    }

    socket.on("userList", (userList) => {
      setUsers(userList);
    });

    socket.on("videoUploaded", (videoPath) => {
      setVideoURL(videoPath);
    });

    socket.on("videoState", ({ action, time }) => {
      if (!videoRef.current) return;
      isRemoteEvent.current = true;

      if (action === "play") {
        videoRef.current.currentTime = time;
        videoRef.current.play();
      } else if (action === "pause") {
        videoRef.current.pause();
      } else if (action === "seek") {
        videoRef.current.currentTime = time;
      }
    });

    return () => {
      socket.off("userList");
      socket.off("videoUploaded");
      socket.off("videoState");
    };
  }, [roomId, userName]);

  const handlePlay = () => {
    if (isRemoteEvent.current) {
      isRemoteEvent.current = false;
      return;
    }
    socket.emit("videoAction", { roomId, action: "play", time: videoRef.current.currentTime });
  };

  const handlePause = () => {
    if (isRemoteEvent.current) {
      isRemoteEvent.current = false;
      return;
    }
    socket.emit("videoAction", { roomId, action: "pause", time: videoRef.current.currentTime });
  };

  const handleSeek = () => {
    if (isRemoteEvent.current) {
      isRemoteEvent.current = false;
      return;
    }
    socket.emit("videoAction", { roomId, action: "seek", time: videoRef.current.currentTime });
  };

  const uploadVideo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);

    const res = await axios.post("http://localhost:5000/upload", formData);
    if (res.data.success) {
      socket.emit("videoUploaded", res.data.videoPath, roomId);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Room: {roomId}</h1>
      <h3>Users in Room:</h3>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
      <input type="file" accept="video/*" onChange={uploadVideo} />
      {videoURL && (
        <video
          ref={videoRef}
          controls
          width="600"
          src={videoURL}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeek}
        />
      )}
    </div>
  );
}

export default Room;
