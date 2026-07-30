import { Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { AvatarEditor } from "./AvatarEditor";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormField } from "./FormField";
import { FormError } from "./FormError";
import { profileSchema } from "../validation/profileSchema";
import { parseApiErrors } from "../utils/apiError";
import { Button } from "./ui/Button";
import { AnimatePresence } from "framer-motion";

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
      {loading && <p className="text-content-muted">Loading...</p>}

      {(error || isError) && (
        <FormError className="mb-4" message={error ?? "Failed to load profile"} />
      )}

      {!loading && user && (
        <>
          <AvatarEditor user={user} />

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
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="neutral" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          ) : (
            <div className="space-y-5">
              <div className="divide-y divide-line overflow-hidden rounded-card border border-line">
                <Row label="Username" value={user.userName} />
                <Row label="First name" value={user.name} />
                <Row label="Surname" value={user.surname} />
                <Row label="Phone" value={user.phone} />
                <Row label="Birthday" value={user.birthday} />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setError(null);
                    setIsEditing(true);
                  }}
                  fullWidth
                >
                  <Pencil size={15} aria-hidden="true" />
                  Edit profile
                </Button>
                <Button variant="neutral" fullWidth onClick={handleLogout}>
                  Logout
                </Button>
              </div>

              <div className="border-t border-line pt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:text-danger"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  Delete account
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
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
      </AnimatePresence>
    </>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 bg-surface-muted/40 px-4 py-2.5">
      <span className="shrink-0 text-sm text-content-muted">{label}</span>
      <span
        className={`truncate text-sm ${value ? "font-medium text-content" : "text-content-subtle"}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
