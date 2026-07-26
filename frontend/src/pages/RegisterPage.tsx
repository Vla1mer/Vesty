import { Link, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import { register, login } from "../api/auth";
import { useAuth } from "../context/useAuth";
import { FormField } from "../components/FormField";
import { FormError } from "../components/FormError";
import { registerSchema } from "../validation/authSchemas";
import { parseApiErrors } from "../utils/apiError";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
          <Form className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">
                <span className="text-amber-400">Vesty</span>{" "}
                <span className="text-slate-100">Messenger</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">Create your account</p>
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


            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white disabled:bg-slate-700 disabled:cursor-not-allowed font-medium transition"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>

            <p className="text-sm text-center text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-amber-400 hover:underline">
                Sign in
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}
