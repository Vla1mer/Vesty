import { Link, useNavigate } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { Formik, Form } from "formik";
import { login } from "../api/auth";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/useLanguage";
import { FormField } from "../components/FormField";
import { FormError } from "../components/FormError";
import { loginSchema } from "../validation/authSchemas";
import type { AxiosError } from "axios";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="relative min-h-viewport flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Formik
        initialValues={{ userName: "", password: "", rememberMe: true }}
        validationSchema={loginSchema}
        onSubmit={async (values, { setStatus }) => {
          setStatus(null);
          try {
            await login(values);
            setAuthenticated();
            navigate("/chats");
          } catch (err) {
            const axiosErr = err as AxiosError;
            if (axiosErr.response?.status === 401) {
              setStatus(t("login.wrongPassword"));
            } else if (axiosErr.response?.status === 429) {
              setStatus(t("login.lockedOut"));
            } else {
              setStatus(t("login.failed"));
            }
          }
        }}
      >
        {({ isSubmitting, status, values, setFieldValue }) => (
          <Form className="w-full max-w-sm bg-surface border border-line rounded-card shadow-float p-6 space-y-4">
            <div className="text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-card bg-accent text-accent-contrast shadow-raised">
                <MessagesSquare size={24} aria-hidden="true" />
              </span>
              <h1 className="text-2xl font-bold">
                <span className="text-brand">Vesty</span>{" "}
                <span className="text-content">Messenger</span>
              </h1>
              <p className="text-sm text-content-muted mt-1">{t("login.subtitle")}</p>
            </div>

            <FormField
              label={t("login.userName")}
              name="userName"
              autoFocus
              autoComplete="username"
            />
            <FormField
              label={t("login.password")}
              name="password"
              type="password"
              autoComplete="current-password"
            />

            <Checkbox
              checked={values.rememberMe}
              onChange={(checked) => setFieldValue("rememberMe", checked)}
              label={t("login.rememberMe")}
            />

            <FormError message={status} />


            <Button type="submit" fullWidth glow disabled={isSubmitting}>
              {isSubmitting ? t("login.submitting") : t("login.submit")}
            </Button>

            <p className="text-sm text-center text-content-muted">
              {t("login.noAccount")}{" "}
              <Link to="/register" className="text-accent-strong hover:underline">
                {t("login.register")}
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}
