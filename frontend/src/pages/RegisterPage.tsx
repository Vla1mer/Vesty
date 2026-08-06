import { Link, useNavigate } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { Formik, Form } from "formik";
import { register, login } from "../api/auth";
import { useAuth } from "../context/useAuth";
import { FormField } from "../components/FormField";
import { FormError } from "../components/FormError";
import { registerSchema } from "../validation/authSchemas";
import { parseApiErrors } from "../utils/apiError";
import { Button } from "../components/ui/Button";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();

  return (
    <div className="relative min-h-viewport flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Formik
        initialValues={{ userName: "", password: "", confirmPassword: "", name: "", surname: "" }}
        validationSchema={registerSchema}
        onSubmit={async (values, { setStatus, setFieldError }) => {
          setStatus(null);
          try {
            await register({
              userName: values.userName,
              password: values.password,
              name: values.name || undefined,
              surname: values.surname || undefined,
            });
          } catch (err) {
            const { fieldErrors, generalError } = parseApiErrors(
              err,
              "Registration failed. Please try again."
            );
            Object.entries(fieldErrors).forEach(([field, msg]) =>
              setFieldError(field, msg)
            );
            setStatus(generalError ?? null);
            return;
          }

          try {
            await login({
              userName: values.userName,
              password: values.password,
            });
            setAuthenticated();
            navigate("/chats");
          } catch {
            navigate("/login");
          }
        }}
      >
        {({ isSubmitting, status }) => (
          <Form className="w-full max-w-sm bg-surface border border-line rounded-card shadow-float p-6 space-y-4">
            <div className="text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-card bg-accent text-accent-contrast shadow-raised">
                <MessagesSquare size={24} aria-hidden="true" />
              </span>
              <h1 className="text-2xl font-bold">
                <span className="text-brand">Vesty</span>{" "}
                <span className="text-content">Messenger</span>
              </h1>
              <p className="text-sm text-content-muted mt-1">Create your account</p>
            </div>

            <FormField
              label="Username *"
              name="userName"
              autoFocus
              autoComplete="username"
              maxLength={50}
            />
            <FormField
              label="Password *"
              name="password"
              type="password"
              autoComplete="new-password"
              hint="Min 6 characters, at least 1 digit"
            />
            <FormField
              label="Confirm password *"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
            />
            <FormField label="First name" name="name" maxLength={100} />
            <FormField label="Surname" name="surname" maxLength={100} />

            <FormError message={status} />


            <Button type="submit" fullWidth glow disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register"}
            </Button>

            <p className="text-sm text-center text-content-muted">
              Already have an account?{" "}
              <Link to="/login" className="text-accent-strong hover:underline">
                Sign in
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}
