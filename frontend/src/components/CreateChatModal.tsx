import { useEffect, useMemo, useState } from "react";
import { ValidationError } from "yup";
import { useCreateChatMutation } from "../store/chatApi";
import { useGetAllUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { FormError } from "./FormError";
import { chatNameSchema } from "../validation/chatSchemas";
import { getApiErrorMessage } from "../utils/apiError";
import type { UserDto } from "../types/api";

interface Props {
  onClose: () => void;
}

export function CreateChatModal({ onClose }: Props) {
  const { userId: currentUserId } = useAuth();
  const [createChat, { isLoading: creating }] = useCreateChatMutation();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserDto[]>([]);
  const [search, setSearch] = useState("");

  const { data: users = [], isFetching } = useGetAllUsersQuery(undefined, {
    skip: step !== 2 || search.trim().length === 0,
  });

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const candidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return users
      .filter((u) => u.id !== currentUserId)
      .filter((u) => !selected.some((s) => s.id === u.id))
      .filter((u) => u.userName.toLowerCase().includes(term));
  }, [users, search, currentUserId, selected]);

  async function handleNext() {
    const trimmed = name.trim();
    try {
      await chatNameSchema.validate({ name: trimmed });
    } catch (err) {
      setNameError((err as ValidationError).message);
      return;
    }
    setNameError(null);
    setStep(2);
  }

  async function handleCreate() {
    setError(null);
    try {
      await createChat({
        name: name.trim(),
        members: selected.map((u) => ({ userId: u.id })),
      }).unwrap();
      onClose();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Failed to create chat. Please try again.")
      );
    }
  }

  function addUser(user: UserDto) {
    setSelected((prev) => [...prev, user]);
    setSearch("");
  }

  function removeUser(id: number) {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div
      className="fixed inset-0 bg-scrim bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised border border-line rounded-xl p-6 w-full max-w-sm max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-content">
            {step === 1 ? "New group chat" : "Add members"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-content-muted hover:text-content text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-content-muted mb-1">
                Chat name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNext();
                }}
                autoFocus
                maxLength={200}
                className={`w-full px-3 py-2 rounded bg-surface border text-content focus:outline-none ${
                  nameError
                    ? "border-danger focus:border-danger"
                    : "border-line-strong focus:border-accent"
                }`}
              />
              {nameError && (
                <p className="text-xs text-danger mt-1">{nameError}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-surface-overlay hover:bg-line-strong text-content transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded bg-accent hover:bg-accent-hover text-accent-contrast font-medium transition"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 min-h-0">
            <p className="text-sm text-content-muted">
              Add people to <span className="text-content">{name.trim()}</span>{" "}
              — or skip and add them later.
            </p>

            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-surface-overlay text-content text-sm"
                  >
                    {u.userName}
                    <button
                      type="button"
                      onClick={() => removeUser(u.id)}
                      className="text-content-muted hover:text-content"
                      aria-label={`Remove ${u.userName}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username..."
              autoFocus
              className="w-full px-3 py-2 rounded bg-surface border border-line-strong text-content text-sm focus:outline-none focus:border-accent"
            />

            {search.trim().length > 0 && (
              <div className="max-h-40 overflow-y-auto">
                {isFetching ? (
                  <p className="text-sm text-content-subtle py-2 text-center">
                    Searching...
                  </p>
                ) : candidates.length === 0 ? (
                  <p className="text-sm text-content-subtle py-2 text-center">
                    No users match your search
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {candidates.map((u) => (
                      <li
                        key={u.id}
                        className="flex items-center justify-between rounded bg-surface px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-content text-sm truncate">
                            {u.userName}
                          </p>
                          {(u.name || u.surname) && (
                            <p className="text-xs text-content-muted truncate">
                              {[u.name, u.surname].filter(Boolean).join(" ")}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => addUser(u)}
                          className="text-xs px-2 py-1 rounded bg-accent hover:bg-accent-hover text-accent-contrast transition"
                        >
                          + Add
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <FormError message={error} />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={creating}
                className="px-4 py-2 rounded bg-surface-overlay hover:bg-line-strong text-content transition disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 rounded bg-accent hover:bg-accent-hover text-accent-contrast disabled:bg-surface-overlay disabled:cursor-not-allowed font-medium transition"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
