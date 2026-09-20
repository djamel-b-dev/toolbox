import { Suspense } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ToolPageHeader } from "@toolbox/ui";
import { TOOLS } from "@toolbox/tools";
import type { AppContext } from "../Layout";

export default function ToolPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCategoryFilter } = useOutletContext<AppContext>();
  const tool = TOOLS.find((t) => t.id === id);

  function goHome() {
    setCategoryFilter("all");
    navigate("/");
  }

  if (!tool) {
    return <div className="empty-state">Cet outil n'existe pas.</div>;
  }

  if (tool.status !== "ready" || !tool.Component) {
    return (
      <div>
        <ToolPageHeader title={tool.name} description={tool.description} onBack={goHome} />
        <div className="empty-state">Cet outil ne fait pas encore partie de ce prototype.</div>
      </div>
    );
  }

  const ToolComponent = tool.Component;

  return (
    <div>
      <ToolPageHeader
        title={tool.name}
        description={tool.description}
        onBack={goHome}
        statusLabel="Calculé en local — aucune requête réseau"
      />
      <Suspense fallback={<div className="empty-state">Chargement de l'outil…</div>}>
        <ToolComponent />
      </Suspense>
    </div>
  );
}
