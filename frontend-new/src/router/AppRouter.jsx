import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import SinglePlayer from "../pages/SinglePlayer/SinglePlayer";
import PublicMatch from "../pages/Multiplayer/PublicMatch";
import CreatePrivateRoom from "../pages/Multiplayer/CreatePrivateRoom";
import JoinPrivateRoom from "../pages/Multiplayer/JoinPrivateRoom";
import MultiplayerGame from "../pages/Multiplayer/MultiplayerGame";
import Auth from "../pages/Auth/Auth";
import Dashboard from "../pages/Dashboard/Dashboard";
import NotFound from "../pages/NotFound";
import Leaderboard from "../pages/Leaderboard/Leaderboard";
function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

export default function AppRouter() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/game/:roomId" element={<MultiplayerGame />} />
        
        <Route path="/multiplayer/public"
          element={<PrivateRoute><PublicMatch/></PrivateRoute>}
        />

        <Route path="/multiplayer/private/create"
          element={<PrivateRoute><CreatePrivateRoom/></PrivateRoute>}
        />

        <Route path="/multiplayer/private/join"
          element={<PrivateRoute><JoinPrivateRoom/></PrivateRoute>}
        />

        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
        <Route path="/register" element={<Navigate to="/login" />} />
        
        <Route path="/single-player"
          element={
            <PrivateRoute>
              <SinglePlayer />
            </PrivateRoute>
          }
        />

        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/leaderboard"
  element={
    <PrivateRoute>
      <Leaderboard />
    </PrivateRoute>
  }
/>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}