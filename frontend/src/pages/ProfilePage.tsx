import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getUserById, updateUser, deleteUser } from "../api/users";
import { useAuth } from "../context/useAuth";
import { BottomNav } from "../components/BottomNav";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { UserDto } from "../types/api";
import type { AxiosError } from "axios";

export function ProfilePage() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();

  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(userId !== null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Поля формы редактирования
  const [userName, setUserName] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");

  useEffect(() => {
    if (userId === null) {
      return;
    }
    let cancelled = false;
    getUserById(userId)
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function startEdit() {
    if (!user) return;
    setUserName(user.userName);
    setName(user.name ?? "");
    setSurname(user.surname ?? "");
    setPhone(user.phone ?? "");
    setBirthday(user.birthday ?? "");
    setError(null);
    setIsEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (userId === null || saving) return;

    setSaving(true);
    setError(null);
    try {
      await updateUser(userId, {
        userName: userName.trim(),
        name: name.trim() || undefined,
        surname: surname.trim() || undefined,
        phone: phone.trim() || undefined,
        birthday: birthday || undefined,
      });
      setUser((prev) =>
        prev
          ? {
              ...prev,
              userName: userName.trim(),
              name: name.trim() || undefined,
              surname: surname.trim() || undefined,
              phone: phone.trim() || undefined,
              birthday: birthday || undefined,
            }
          : prev
      );
      setIsEditing(false);
    } catch (err) {
      const axiosErr = err as AxiosError<{ errors?: Record<string, string[]> }>;
      const data = axiosErr.response?.data;
      if (data?.errors) {
        setError(Object.values(data.errors).flat().join(" "));
      } else {
        setError("Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (userId === null) return;
    setDeleting(true);
    try {
      await deleteUser(userId);
      logout();
      navigate("/login", { replace: true });
    } catch {
      setError("Failed to delete account");
      setIsDeleteOpen(false);
      setDeleting(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pb-28">
      <h1 className="text-3xl font-bold text-slate-100 mb-6">Profile</h1>

      {loading && <p className="text-slate-400">Loading...</p>}

      {error && (
        <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-3 mb-4 w-full max-w-md">
          {error}
        </div>
      )}

      {!loading && user && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <Field label="Username *">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  maxLength={50}
                  className={inputClass}
                />
              </Field>
              <Field label="First name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className={inputClass}
                />
              </Field>
              <Field label="Surname">
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  maxLength={100}
                  className={inputClass}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={20}
                  className={inputClass}
                />
              </Field>
              <Field label="Birthday">
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || !userName.trim()}
                  className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <Row label="Username" value={user.userName} />
              <Row label="First name" value={user.name} />
              <Row label="Surname" value={user.surname} />
              <Row label="Phone" value={user.phone} />
              <Row label="Birthday" value={user.birthday} />

              <div className="pt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={startEdit}
                  className="w-full px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium transition"
                >
                  ✏️ Edit profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 transition"
                >
                  Logout
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(true)}
                  className="w-full px-4 py-2 rounded bg-red-900 hover:bg-red-800 text-red-100 transition"
                >
                  Delete account
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isDeleteOpen && (
        <ConfirmDialog
          title="Delete account?"
          message="Your account will be permanently deleted. This action cannot be undone."
          confirmText="Delete"
          variant="danger"
          loading={deleting}
          onConfirm={handleDeleteAccount}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-amber-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between border-b border-slate-700 pb-2">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-slate-100">{value || "—"}</span>
    </div>
  );
}
