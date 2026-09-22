import { Suspense } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Icon, ToolPageHeader } from "@toolbox/ui";
import type { AppContext } from "../Layout";

export default function ToolPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCategoryFilter, tools, removeCustomTool, strings, toolText } = useOutletContext<AppContext>();
  const tool = tools.find((t) => t.id === id);

  function goHome() {
    setCategoryFilter("all");
    navigate("/");
  }

  if (!tool) {
    return <div className="empty-state">{strings.toolPage.notFound}</div>;
  }

  const { name, description } = toolText(tool);

  if (tool.status !== "ready" || !tool.Component) {
    return (
      <div>
        <ToolPageHeader title={name} description={description} onBack={goHome} />
        <div className="empty-state">{strings.toolPage.notReady}</div>
      </div>
    );
  }

  const ToolComponent = tool.Component;

  function handleDelete() {
    if (!window.confirm(strings.toolPage.deleteConfirm(name))) return;
    removeCustomTool(tool!.id);
    goHome();
  }

  return (
    <div>
      <ToolPageHeader
        title={name}
        description={description}
        onBack={goHome}
        statusLabel={tool.statusLabel ?? strings.common.localOnlyStatus}
        statusTone={tool.statusTone}
      />
      {tool.custom && (
        <div className="panel-tools mb-lg">
          <button type="button" className="btn" onClick={() => navigate(`/creer-outil?id=${tool.id}`)}>
            {strings.toolPage.edit}
          </button>
          <button type="button" className="btn" onClick={handleDelete}>
            <Icon name="trash" />
            {strings.toolPage.delete}
          </button>
        </div>
      )}
      <Suspense fallback={<div className="empty-state">{strings.toolPage.loading}</div>}>
        <ToolComponent />
      </Suspense>
    </div>
  );
}
