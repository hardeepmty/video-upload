import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000");

function Room() {
  const { roomId } = useParams();
  const [videoURL, setVideoURL] = useState("");
  const videoRef = useRef(null);
  const isRemoteEvent = useRef(false); // Prevent event loop

  useEffect(() => {
    socket.emit("joinRoom", roomId);

    socket.on("videoUploaded", (videoPath) => {
      setVideoURL(videoPath);
    });

    socket.on("videoState", ({ action, time }) => {
      if (!videoRef.current) return;

      isRemoteEvent.current = true; // Mark as remote event

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
      socket.off("videoUploaded");
      socket.off("videoState");
    };
  }, [roomId]);

  const handlePlay = () => {
    if (isRemoteEvent.current) {
      isRemoteEvent.current = false; // Ignore self-triggered event
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
