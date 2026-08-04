import { useNavigate } from "react-router-dom";
import { SelectUserContent } from "../components/SelectUserContent";
import { PageShell } from "../components/ui/PageShell";

export function SelectUserPage() {
  const navigate = useNavigate();

  return (
    <PageShell title="Start a chat" onBack={() => navigate("/chats")}>
      <SelectUserContent
        onSelected={(userId) =>
          navigate(`/chats/new/${userId}`, { replace: true })
        }
      />
    </PageShell>
  );
}
