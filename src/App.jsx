import { Route, Routes } from 'react-router-dom';
import CreateRoomModal from './components/modals/CreateRoomModal';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ApplicantDetailPage } from './pages/ApplicantDetailPage.jsx';
import { GroupDetailPage } from './pages/GroupDetailPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import MainPage from './pages/MainPage';
import RoomDetailPage from './pages/RoomDetailPage';
import { WorkflowPage } from './pages/SessionsPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/groups/:groupId" element={<GroupDetailPage />} />
        <Route path="/groups/:groupId/applicants/:applicantId" element={<ApplicantDetailPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/sessions" element={<WorkflowPage />} />
        <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
      <CreateRoomModal />
    </>
  );
}
