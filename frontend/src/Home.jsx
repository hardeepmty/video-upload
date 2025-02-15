import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState(""); // New state for user name
  const navigate = useNavigate();

  const createRoom = () => {
    if (!userName.trim()) {
      alert("Please enter your name");
      return;
    }
    const newRoomId = Math.random().toString(36).substr(2, 6); // Generate random room ID
    navigate(`/room/${newRoomId}?name=${encodeURIComponent(userName)}`);
  };

  const joinRoom = () => {
    if (!roomId.trim() || !userName.trim()) {
      alert("Please enter both room ID and your name");
      return;
    }
    navigate(`/room/${roomId}?name=${encodeURIComponent(userName)}`);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Watch Party</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <br />
      <button onClick={createRoom}>Create Room</button>
      <br />
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>
    </div>
  );
}

export default Home;
