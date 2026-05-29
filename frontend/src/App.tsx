import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChatsPage } from "./pages/ChatsPage";
import { ChatDetailPage } from "./pages/ChatDetailPage";
import { NewDirectChatPage } from "./pages/NewDirectChatPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";

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
                <ChatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
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
          <Route
            path="/chats/new/:userId"
            element={
              <ProtectedRoute>
                <NewDirectChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chats/:id"
            element={
              <ProtectedRoute>
                <ChatDetailPage />
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
