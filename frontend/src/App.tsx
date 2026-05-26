import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { VersionBadge } from "./components/VersionBadge";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChatsPage } from "./pages/ChatsPage";
import { ChatDetailPage } from "./pages/ChatDetailPage";

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
            path="/chats/:id"
            element={
              <ProtectedRoute>
                <ChatDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/chats" replace />} />
        </Routes>
        <VersionBadge />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
