import { Link, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import { login } from "../api/auth";
import { useAuth } from "../context/useAuth";
import { FormField } from "../components/FormField";
import { FormError } from "../components/FormError";
import { loginSchema } from "../validation/authSchemas";
import type { AxiosError } from "axios";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Formik
        initialValues={{ userName: "", password: "" }}
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
              setStatus("Invalid username or password");
            } else {
              setStatus("Login failed. Please try again.");
            }
          }
        }}
      >
        {({ isSubmitting, status }) => (
          <Form className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">
                <span className="text-amber-400">ChatApp</span>{" "}
                <span className="text-slate-100">Messenger</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">Sign in to your account</p>
            </div>

            <FormField
              label="Username"
              name="userName"
              autoFocus
              autoComplete="username"
            />
            <FormField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
            />

            <FormError message={status} />


            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white disabled:bg-slate-700 disabled:cursor-not-allowed font-medium transition"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-sm text-center text-slate-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-amber-400 hover:underline">
                Register
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}
