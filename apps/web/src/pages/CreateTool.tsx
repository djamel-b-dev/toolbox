import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { Icon, SegmentedControl } from "@toolbox/ui";
import { CATEGORIES } from "@toolbox/tools";
import type { AppContext } from "../Layout";
import { runCustomCode } from "../CustomToolRunner";

type CategoryMode = "existing" | "new";

export default function CreateTool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const { customTools, addCustomTool, updateCustomTool, strings } = useOutletContext<AppContext>();

  const editingTool = editId ? customTools.find((t) => t.id === editId) : undefined;

  const existingCategoryOptions = useMemo(() => {
    const customCats = customTools.filter((t) => t.isNewCategory).map((t) => t.category);
    return Array.from(new Set([...CATEGORIES, ...customCats])).sort();
  }, [customTools]);

  const [name, setName] = useState(editingTool?.name ?? "");
  const [description, setDescription] = useState(editingTool?.description ?? "");
  const [categoryMode, setCategoryMode] = useState<CategoryMode>(editingTool?.isNewCategory ? "new" : "existing");
  const [existingCategory, setExistingCategory] = useState(
    editingTool && !editingTool.isNewCategory ? editingTool.category : (existingCategoryOptions[0] ?? "Crypto"),
  );
  const [newCategory, setNewCategory] = useState(editingTool?.isNewCategory ? editingTool.category : "");
  const [code, setCode] = useState(editingTool?.code ?? strings.createTool.defaultCode);
  const [testInput, setTestInput] = useState(strings.createTool.testInputDefault);
  const [testOutput, setTestOutput] = useState("");
  const [testError, setTestError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    runCustomCode(code, testInput)
      .then((r) => {
        if (!cancelled) {
          setTestOutput(r);
          setTestError("");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setTestOutput("");
          setTestError(e instanceof Error ? e.message : strings.createTool.runtimeErrorFallback);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code, testInput, strings]);

  const category = categoryMode === "new" ? newCategory.trim() : existingCategory;
  const isNewCategory = categoryMode === "new";

  function handleSave() {
    setSaveError("");
    if (!name.trim()) {
      setSaveError(strings.createTool.errorNameRequired);
      return;
    }
    if (!category) {
      setSaveError(strings.createTool.errorCategoryRequired);
      return;
    }
    if (!code.trim()) {
      setSaveError(strings.createTool.errorCodeRequired);
      return;
    }
    if (isNewCategory && CATEGORIES.includes(category)) {
      setSaveError(strings.createTool.errorCategoryExists);
      return;
    }

    const payload = { name: name.trim(), description: description.trim(), category, isNewCategory, code };
    if (editingTool) {
      updateCustomTool(editingTool.id, payload);
      navigate(`/tools/${editingTool.id}`);
    } else {
      const id = addCustomTool(payload);
      navigate(`/tools/${id}`);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>{editingTool ? strings.createTool.titleEdit : strings.createTool.titleNew}</h1>
        <p className="lede">{strings.createTool.intro}</p>
      </div>

      <div className="field-row">
        <div className="field">
          <span className="field-label">{strings.createTool.nameLabel}</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={strings.createTool.namePlaceholder}
          />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">{strings.createTool.descriptionLabel}</span>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={strings.createTool.descriptionPlaceholder}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field" style={{ maxWidth: 260 }}>
          <span className="field-label">{strings.createTool.categoryLabel}</span>
          <SegmentedControl<CategoryMode>
            value={categoryMode}
            onChange={setCategoryMode}
            options={[
              { value: "existing", label: strings.createTool.categoryExisting },
              { value: "new", label: strings.createTool.categoryNew },
            ]}
          />
        </div>
        {categoryMode === "existing" ? (
          <div className="field">
            <span className="field-label">{strings.createTool.chooseLabel}</span>
            <select className="input" value={existingCategory} onChange={(e) => setExistingCategory(e.target.value)}>
              {existingCategoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="field">
            <span className="field-label">{strings.createTool.newCategoryLabel}</span>
            <input
              className="input"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={strings.createTool.newCategoryPlaceholder}
            />
          </div>
        )}
      </div>

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">{strings.createTool.codeLabel}</span>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          dir="ltr"
          style={{ minHeight: 220 }}
        />
      </div>

      <div className="row-head">
        <h2>{strings.createTool.livePreview}</h2>
      </div>
      <div className="bench mb-lg">
        <div className="panel">
          <div className="panel-head">
            <span className="label">{strings.createTool.testInputLabel}</span>
          </div>
          <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">{strings.createTool.outputLabel}</span>
          </div>
          <pre className={testError ? "is-error" : undefined}>{testError || testOutput}</pre>
        </div>
      </div>

      {saveError && (
        <div className="panel mb-lg">
          <pre className="is-error">{saveError}</pre>
        </div>
      )}

      <div className="panel-tools">
        <button type="button" className="btn" onClick={handleSave}>
          {editingTool ? strings.createTool.saveEdit : strings.createTool.saveNew}
        </button>
      </div>
    </div>
  );
}
