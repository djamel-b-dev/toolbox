import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { Icon, SegmentedControl } from "@toolbox/ui";
import { CATEGORIES } from "@toolbox/tools";
import type { AppContext } from "../Layout";
import { runCustomCode } from "../CustomToolRunner";

const DEFAULT_CODE = `// "input" contient le texte de la zone d'entrée.
// Renvoyez la chaîne à afficher en sortie.
return input.toUpperCase();`;

type CategoryMode = "existing" | "new";

export default function CreateTool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const { customTools, addCustomTool, updateCustomTool } = useOutletContext<AppContext>();

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
  const [code, setCode] = useState(editingTool?.code ?? DEFAULT_CODE);
  const [testInput, setTestInput] = useState("Hello, Workbench 👋");
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
          setTestError(e instanceof Error ? e.message : "Ce code a levé une erreur.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code, testInput]);

  const category = categoryMode === "new" ? newCategory.trim() : existingCategory;
  const isNewCategory = categoryMode === "new";

  function handleSave() {
    setSaveError("");
    if (!name.trim()) {
      setSaveError("Le nom est obligatoire.");
      return;
    }
    if (!category) {
      setSaveError("Choisissez ou nommez une catégorie.");
      return;
    }
    if (!code.trim()) {
      setSaveError("Le code ne peut pas être vide.");
      return;
    }
    if (isNewCategory && CATEGORIES.includes(category)) {
      setSaveError(
        "Ce nom de catégorie existe déjà parmi les catégories intégrées — choisissez-en un autre, ou sélectionnez « Existante » ci-dessus.",
      );
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
        <h1>{editingTool ? "Modifier l'outil" : "Créer un outil"}</h1>
        <p className="lede">
          Écrivez une fonction JavaScript qui transforme une entrée en sortie. Ce code s'exécute directement dans
          votre navigateur, avec les mêmes permissions que la page — n'utilisez que du code que vous avez écrit
          vous-même ou en qui vous avez confiance.
        </p>
      </div>

      <div className="field-row">
        <div className="field">
          <span className="field-label">Nom</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mon convertisseur" />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Description</span>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ce que fait l'outil, en une phrase."
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field" style={{ maxWidth: 260 }}>
          <span className="field-label">Catégorie</span>
          <SegmentedControl<CategoryMode>
            value={categoryMode}
            onChange={setCategoryMode}
            options={[
              { value: "existing", label: "Existante" },
              { value: "new", label: "Nouvelle" },
            ]}
          />
        </div>
        {categoryMode === "existing" ? (
          <div className="field">
            <span className="field-label">Choisir</span>
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
            <span className="field-label">Nom de la nouvelle catégorie</span>
            <input className="input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Mes outils" />
          </div>
        )}
      </div>

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Code</span>
        </div>
        <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} style={{ minHeight: 220 }} />
      </div>

      <div className="row-head">
        <h2>Aperçu en direct</h2>
      </div>
      <div className="bench mb-lg">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Entrée de test</span>
          </div>
          <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Sortie</span>
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
          {editingTool ? "Enregistrer les modifications" : "Créer l'outil"}
        </button>
      </div>
    </div>
  );
}
