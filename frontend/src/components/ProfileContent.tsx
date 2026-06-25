import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormField } from "./FormField";
import { FormError } from "./FormError";
import { profileSchema } from "../validation/profileSchema";
import { parseApiErrors } from "../utils/apiError";

export function ProfileContent() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const {
    data: user,
    isLoading: loading,
    isError,
  } = useGetUserByIdQuery(userId as number, { skip: userId === null });
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();

  async function handleDeleteAccount() {
    if (userId === null) return;
    try {
      await deleteUser(userId).unwrap();
      logout();
      navigate("/login", { replace: true });
    } catch {
      setError("Failed to delete account");
      setIsDeleteOpen(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      {loading && <p className="text-slate-400">Loading...</p>}

      {(error || isError) && (
        <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-3 mb-4">
          {error ?? "Failed to load profile"}
        </div>
      )}

      {!loading && user && (
        <>
          {isEditing ? (
            <Formik
              initialValues={{
                userName: user.userName,
                name: user.name ?? "",
                surname: user.surname ?? "",
                phone: user.phone ?? "",
                birthday: user.birthday ?? "",
              }}
              validationSchema={profileSchema}
              onSubmit={async (values, { setStatus, setFieldError }) => {
                if (userId === null) return;
                setStatus(null);
                const payload = {
                  userName: values.userName.trim(),
                  name: values.name.trim() || undefined,
                  surname: values.surname.trim() || undefined,
                  phone: values.phone.trim() || undefined,
                  birthday: values.birthday || undefined,
                };
                try {
                  await updateUser({ id: userId, dto: payload }).unwrap();
                  setIsEditing(false);
                } catch (err) {
                  const { fieldErrors, generalError } = parseApiErrors(
                    err,
                    "Failed to save profile"
                  );
                  Object.entries(fieldErrors).forEach(([field, msg]) =>
                    setFieldError(field, msg)
                  );
                  setStatus(generalError ?? null);
                }
              }}
            >
              {({ isSubmitting, status }) => (
                <Form className="space-y-4">
                  <FormField label="Username *" name="userName" maxLength={50} />
                  <FormField label="First name" name="name" maxLength={100} />
                  <FormField label="Surname" name="surname" maxLength={100} />
                  <FormField label="Phone" name="phone" type="tel" maxLength={20} />
                  <FormField label="Birthday" name="birthday" type="date" />

                  <FormError message={status} />

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-50 transition"
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:opacity-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
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
                  onClick={() => {
                    setError(null);
                    setIsEditing(true);
                  }}
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
        </>
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
    </>
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
