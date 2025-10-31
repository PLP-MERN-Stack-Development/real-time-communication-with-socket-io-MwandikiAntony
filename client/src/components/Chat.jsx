import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { socket } from "../socket/socket";

export default function Chat() {
  const { username } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [selectedUser, setSelectedUser] = useState(""); // For private messages

  // Store mapping of socketId => username
  const [onlineUsersSockets, setOnlineUsersSockets] = useState({});

  // Browser notifications
  useEffect(() => {
    if (Notification.permission !== "granted") Notification.requestPermission();

    socket.on("receiveMessage", (msg) => {
      setChat((prev) => [...prev, msg]);
      if (msg.user !== username && Notification.permission === "granted") {
        new Notification(`New message from ${msg.user}`, { body: msg.text });
      }
    });

    socket.on("receivePrivateMessage", (msg) => {
      setChat((prev) => [...prev, { ...msg, private: true }]);
      if (msg.user !== username && Notification.permission === "granted") {
        new Notification(`Private message from ${msg.user}`, { body: msg.text });
      }
    });

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
      // Keep mapping of usernames to socketIds
      const mapping = {};
      users.forEach((u, idx) => {
        mapping[idx] = u; // We'll assign temporary ids
      });
      setOnlineUsersSockets(mapping);
    });

    socket.on("typing", (user) => setTyping(`${user} is typing...`));
    socket.on("notification", (note) => alert(note));

    socket.on("reactionUpdated", ({ messageId, reaction }) => {
      setChat((prev) =>
        prev.map((msg, idx) => (idx === messageId ? { ...msg, reaction } : msg))
      );
    });

    socket.on("receiveFile", (data) => setChat((prev) => [...prev, { ...data, file: true }]));

    return () => {
      socket.off("receiveMessage");
      socket.off("receivePrivateMessage");
      socket.off("onlineUsers");
      socket.off("typing");
      socket.off("notification");
      socket.off("reactionUpdated");
      socket.off("receiveFile");
    };
  }, [username]);

  // Send global message
  const handleSend = () => {
    if (!message) return;
    if (selectedUser) {
      sendPrivateMessage();
      return;
    }
    socket.emit("sendMessage", { user: username, text: message });
    setMessage("");
  };

  // Typing indicator
  const handleTyping = () => socket.emit("typing", username);

  // Private message
  const sendPrivateMessage = () => {
    if (!message || !selectedUser) return alert("Select a user to send private message");
    const toSocketId = Object.keys(onlineUsersSockets).find(
      (key) => onlineUsersSockets[key] === selectedUser
    );
    if (!toSocketId) return alert("User not found");
    socket.emit("privateMessage", { toSocketId, message: { user: username, text: message } });
    setMessage("");
  };

  // Reactions
  const addReaction = (messageId, reaction) => socket.emit("reaction", { messageId, reaction });

  // File/Image upload
  const sendFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("sendFile", { user: username, fileName: file.name, fileData: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {username}</h2>

      <div>
        <h4>Online Users:</h4>
        <ul>
          {onlineUsers.map((u, i) => (
            <li key={i}>
              <button
                onClick={() => setSelectedUser(u)}
                style={{ fontWeight: selectedUser === u ? "bold" : "normal" }}
              >
                {u}
              </button>
            </li>
          ))}
        </ul>
        {selectedUser && <p>Private messaging: {selectedUser}</p>}
      </div>

      <div style={{ border: "1px solid #ccc", padding: "10px", height: "300px", overflowY: "scroll" }}>
        {chat.map((c, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            {c.file ? (
              <div>
                <strong>{c.user}{c.private ? " (private)" : ""}:</strong>{" "}
                <a href={c.fileData} download={c.fileName}>
                  {c.fileName}
                </a>{" "}
                <small>({c.time})</small>
              </div>
            ) : (
              <p>
                <strong>{c.user}{c.private ? " (private)" : ""}:</strong> {c.text}{" "}
                <small>({c.time})</small>
                {c.reaction && <span> {c.reaction}</span>}
                <button onClick={() => addReaction(i, "👍")}>👍</button>
                <button onClick={() => addReaction(i, "❤️")}>❤️</button>
              </p>
            )}
          </div>
        ))}
        {typing && <p style={{ fontStyle: "italic" }}>{typing}</p>}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleTyping}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
      <input type="file" onChange={sendFile} style={{ marginLeft: "10px" }} />
    </div>
  );
}
