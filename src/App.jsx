import { Routes, Route } from "react-router-dom";
import CreateRoomModal from "./components/modals/CreateRoomModal";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import SessionsPage from "./pages/SessionsPage";
import SignupPage from "./pages/SignupPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
      <CreateRoomModal />
    </>
  );
}

export default App;
