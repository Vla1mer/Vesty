import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ChatLayout } from "./components/ChatLayout";
import { ChatEmptyState } from "./components/ChatEmptyState";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChatDetailPage } from "./pages/ChatDetailPage";
import { ChatSettingsPage } from "./pages/ChatSettingsPage";
import { ChatInfoPage } from "./pages/ChatInfoPage";
import { CreateChatPage } from "./pages/CreateChatPage";
import { SelectUserPage } from "./pages/SelectUserPage";
import { NewDirectChatPage } from "./pages/NewDirectChatPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { FriendsPage } from "./pages/FriendsPage";
import { JoinChatPage } from "./pages/JoinChatPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/chats"
            element={
              <ProtectedRoute>
                <ChatLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ChatEmptyState />} />
            <Route path="new-group" element={<CreateChatPage />} />
            <Route path="new-direct" element={<SelectUserPage />} />
            <Route path="new/:userId" element={<NewDirectChatPage />} />
            <Route path=":id" element={<ChatDetailPage />} />
            <Route path=":id/info" element={<ChatInfoPage />} />
            <Route path=":id/settings" element={<ChatSettingsPage />} />
          </Route>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <FriendsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join/:code"
            element={
              <ProtectedRoute>
                <JoinChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/chats" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
