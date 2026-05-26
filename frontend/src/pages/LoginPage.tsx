import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../context/useAuth";
import type { AxiosError } from "axios";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ userName, password });
      setAuthenticated();
      navigate("/chats");
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 401) {
        setError("Invalid username or password");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-amber-400">ChatApp</span>{" "}
            <span className="text-slate-100">Messenger</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to your account</p>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Username</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            autoFocus
            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white disabled:bg-slate-700 disabled:cursor-not-allowed font-medium transition"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-sm text-center text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-amber-400 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
