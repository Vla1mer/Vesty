import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { ValidationError } from "yup";
import { useCreateChatMutation } from "../store/chatApi";
import { useGetAllUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { TextInput } from "./ui/TextInput";
import { FormError } from "./FormError";
import { chatNameSchema, CHAT_NAME_LIMIT } from "../validation/chatSchemas";
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
    <Modal
      title={step === 1 ? "New group chat" : "Add members"}
      onClose={onClose}
      layout="column"
    >
      {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-content-muted mb-1">
                Chat name
              </label>
              <TextInput
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNext();
                }}
                autoFocus
                maxLength={CHAT_NAME_LIMIT}
                invalid={Boolean(nameError)}
              />
              {nameError && (
                <p className="text-xs text-danger mt-1">{nameError}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="neutral" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleNext}>Next</Button>
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
                      className="text-content-muted transition hover:text-content"
                      aria-label={`Remove ${u.userName}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <TextInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username..."
              autoFocus
              className="text-sm"
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
                        <Button size="xs" onClick={() => addUser(u)}>
                          + Add
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <FormError message={error} />

            <div className="flex gap-2 justify-end">
              <Button variant="neutral" onClick={() => setStep(1)} disabled={creating}>
                Back
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
      )}
    </Modal>
  );
}
