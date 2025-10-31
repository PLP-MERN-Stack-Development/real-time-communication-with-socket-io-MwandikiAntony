import { useState } from "react";
import { UserProvider } from "./context/UserContext";
import Login from "./components/Login";
import Chat from "./components/Chat";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <UserProvider>
      {loggedIn ? <Chat /> : <Login setLoggedIn={setLoggedIn} />}
    </UserProvider>
  );
}

export default App;
