import { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { socket } from "../socket/socket";

export default function Login({ setLoggedIn }) {
  const [name, setName] = useState("");
  const { setUsername } = useContext(UserContext);

  const handleLogin = () => {
    if (!name) return alert("Enter username");
    setUsername(name);
    socket.emit("join", name);
    setLoggedIn(true);
  };

  return (
    <div style={{textAlign:"center", marginTop:"50px"}}>
      <h2>Enter Username to Join Chat</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Username"
      />
      <button onClick={handleLogin}>Join</button>
    </div>
  );
}
