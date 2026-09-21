import { Suspense } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Icon, ToolPageHeader } from "@toolbox/ui";
import type { AppContext } from "../Layout";

export default function ToolPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCategoryFilter, tools, removeCustomTool } = useOutletContext<AppContext>();
  const tool = tools.find((t) => t.id === id);

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

  function handleDelete() {
    if (!window.confirm(`Supprimer définitivement l'outil « ${tool!.name} » ?`)) return;
    removeCustomTool(tool!.id);
    goHome();
  }

  return (
    <div>
      <ToolPageHeader
        title={tool.name}
        description={tool.description}
        onBack={goHome}
        statusLabel="Calculé en local — aucune requête réseau"
      />
      {tool.custom && (
        <div className="panel-tools mb-lg">
          <button type="button" className="btn" onClick={() => navigate(`/creer-outil?id=${tool.id}`)}>
            Modifier
          </button>
          <button type="button" className="btn" onClick={handleDelete}>
            <Icon name="trash" />
            Supprimer
          </button>
        </div>
      )}
      <Suspense fallback={<div className="empty-state">Chargement de l'outil…</div>}>
        <ToolComponent />
      </Suspense>
    </div>
  );
}
