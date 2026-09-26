import { useLanguage } from "../context/useLanguage";
import { useNavigate } from "react-router-dom";
import { SelectUserContent } from "../components/SelectUserContent";
import { PageShell } from "../components/ui/PageShell";

export function SelectUserPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <PageShell title={t("chats.startChat")} onBack={() => navigate("/chats")}>
      <SelectUserContent
        onSelected={(userId) =>
          navigate(`/chats/new/${userId}`, { replace: true })
        }
      />
    </PageShell>
  );
}
