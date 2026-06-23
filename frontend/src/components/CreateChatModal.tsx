import { useEffect } from "react";
import { Formik, Form } from "formik";
import { useCreateChatMutation } from "../store/chatApi";
import { FormField } from "./FormField";
import { FormError } from "./FormError";
import { chatNameSchema } from "../validation/chatSchemas";
import { getApiErrorMessage } from "../utils/apiError";

interface Props {
  onClose: () => void;
}

export function CreateChatModal({ onClose }: Props) {
  const [createChat] = useCreateChatMutation();

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100">New chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <Formik
          initialValues={{ name: "" }}
          validationSchema={chatNameSchema}
          onSubmit={async (values, { setStatus }) => {
            setStatus(null);
            try {
              await createChat({ name: values.name.trim() }).unwrap();
              onClose();
            } catch (err) {
              setStatus(getApiErrorMessage(err, "Failed to create chat. Please try again."));
            }
          }}
        >
          {({ isSubmitting, status }) => (
            <Form className="space-y-4">
              <FormField
                label="Chat name"
                name="name"
                autoFocus
                maxLength={200}
              />

              <FormError message={status} />


              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white disabled:bg-slate-700 disabled:cursor-not-allowed font-medium transition"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
