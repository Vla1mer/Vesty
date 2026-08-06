import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetUserByIdQuery } from "../store/userApi";
import { UserProfileContent } from "../components/UserProfileContent";
import { FormError } from "../components/FormError";
import { PageShell } from "../components/ui/PageShell";
import type { AxiosBaseQueryError } from "../api/axiosBaseQuery";

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const id = Number(userId);
  const isValidUser = Number.isFinite(id);

  const { data: user, isLoading, error } = useGetUserByIdQuery(id, {
    skip: !isValidUser,
  });

  const loadError = useMemo(() => {
    if (!isValidUser) return "Invalid user id";
    if (!error) return null;
    const status = (error as AxiosBaseQueryError).status;
    return status === 404 ? "User not found" : "Failed to load the profile";
  }, [isValidUser, error]);

  return (
    <PageShell title="Profile" onBack={() => navigate(-1)}>
      {loadError ? (
        <FormError message={loadError} />
      ) : isLoading || !user ? (
        <p className="py-6 text-center text-sm text-content-subtle">Loading...</p>
      ) : (
        <UserProfileContent user={user} />
      )}
    </PageShell>
  );
}
