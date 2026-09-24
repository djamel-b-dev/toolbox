import { useMemo, useState } from "react";
import { CopyButton } from "@toolbox/ui";
import { CodeView } from "../shared/CodeView";

type Group = "Langages" | "Frameworks" | "Outils" | "Éditeurs" | "Systèmes";

// Curated from the patterns maintained in github/gitignore, trimmed to what people actually hit.
const TEMPLATES: { id: string; label: string; group: Group; lines: string }[] = [
  { id: "node", label: "Node.js", group: "Langages", lines: "node_modules/\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\npnpm-debug.log*\n.pnpm-store/\n.npm/\n.yarn/*\n!.yarn/releases\n!.yarn/plugins\n*.tsbuildinfo\n.eslintcache\ncoverage/\n.nyc_output/" },
  { id: "python", label: "Python", group: "Langages", lines: "__pycache__/\n*.py[cod]\n*$py.class\n*.egg-info/\n.eggs/\nbuild/\ndist/\n.venv/\nvenv/\nenv/\n.pytest_cache/\n.mypy_cache/\n.ruff_cache/\n.tox/\n.coverage\nhtmlcov/\n.ipynb_checkpoints/" },
  { id: "java", label: "Java", group: "Langages", lines: "*.class\n*.jar\n*.war\n*.ear\n*.log\nhs_err_pid*\nreplay_pid*" },
  { id: "maven", label: "Maven", group: "Outils", lines: "target/\npom.xml.tag\npom.xml.releaseBackup\npom.xml.versionsBackup\nrelease.properties\n.mvn/wrapper/maven-wrapper.jar" },
  { id: "gradle", label: "Gradle", group: "Outils", lines: ".gradle/\nbuild/\n!gradle/wrapper/gradle-wrapper.jar\nout/" },
  { id: "go", label: "Go", group: "Langages", lines: "*.exe\n*.exe~\n*.dll\n*.so\n*.dylib\n*.test\n*.out\ngo.work\ngo.work.sum\nvendor/" },
  { id: "rust", label: "Rust", group: "Langages", lines: "target/\n**/*.rs.bk\n*.pdb" },
  { id: "dotnet", label: ".NET / C#", group: "Langages", lines: "bin/\nobj/\n*.user\n*.suo\n*.userprefs\n*.nupkg\npackages/\n!packages/build/\nTestResults/\n[Dd]ebug/\n[Rr]elease/" },
  { id: "php", label: "PHP / Composer", group: "Langages", lines: "vendor/\ncomposer.phar\n.phpunit.result.cache\n.php-cs-fixer.cache" },
  { id: "ruby", label: "Ruby", group: "Langages", lines: "*.gem\n.bundle/\nvendor/bundle/\nlog/*\ntmp/*\n.byebug_history" },
  { id: "swift", label: "Swift / Xcode", group: "Langages", lines: "xcuserdata/\n*.xcscmblueprint\n*.xccheckout\nDerivedData/\nbuild/\n.build/\nPods/\n*.ipa\n*.dSYM.zip\n*.dSYM" },
  { id: "android", label: "Android", group: "Frameworks", lines: "*.apk\n*.aab\n*.ap_\n.gradle/\nlocal.properties\n.externalNativeBuild/\n.cxx/\ncaptures/\n*.keystore\n!debug.keystore" },
  { id: "react", label: "React / Vite", group: "Frameworks", lines: "dist/\ndist-ssr/\n*.local\n.vite/" },
  { id: "next", label: "Next.js", group: "Frameworks", lines: ".next/\nout/\nnext-env.d.ts\n.vercel/" },
  { id: "nuxt", label: "Nuxt", group: "Frameworks", lines: ".nuxt/\n.output/\n.data/\n.nitro/\n.cache/" },
  { id: "angular", label: "Angular", group: "Frameworks", lines: "/dist\n/tmp\n/out-tsc\n/bazel-out\n.angular/cache\n.sass-cache/" },
  { id: "django", label: "Django", group: "Frameworks", lines: "*.log\nlocal_settings.py\ndb.sqlite3\ndb.sqlite3-journal\nmedia/\nstaticfiles/" },
  { id: "laravel", label: "Laravel", group: "Frameworks", lines: "/vendor\n/node_modules\n/public/hot\n/public/storage\n/storage/*.key\n.phpunit.result.cache\nHomestead.json\nHomestead.yaml" },
  { id: "flutter", label: "Flutter / Dart", group: "Frameworks", lines: ".dart_tool/\n.flutter-plugins\n.flutter-plugins-dependencies\n.packages\n.pub-cache/\n.pub/\nbuild/" },
  { id: "unity", label: "Unity", group: "Frameworks", lines: "/[Ll]ibrary/\n/[Tt]emp/\n/[Oo]bj/\n/[Bb]uild/\n/[Bb]uilds/\n/[Ll]ogs/\n/[Uu]ser[Ss]ettings/\n*.csproj\n*.sln\n*.pidb\n*.booproj\ncrashlytics-build.properties" },
  { id: "terraform", label: "Terraform", group: "Outils", lines: "**/.terraform/*\n*.tfstate\n*.tfstate.*\ncrash.log\ncrash.*.log\n*.tfvars\n*.tfvars.json\noverride.tf\noverride.tf.json\n*_override.tf\n.terraformrc\nterraform.rc" },
  { id: "docker", label: "Docker", group: "Outils", lines: ".docker/\ndocker-compose.override.yml" },
  { id: "env", label: "Secrets & .env", group: "Outils", lines: ".env\n.env.*\n!.env.example\n*.pem\n*.key\n*.p12\n*.pfx\nsecrets/" },
  { id: "logs", label: "Logs & temporaires", group: "Outils", lines: "*.log\nlogs/\n*.tmp\n*.temp\n*.swp\n*.bak\ntmp/" },
  { id: "vscode", label: "VS Code", group: "Éditeurs", lines: ".vscode/*\n!.vscode/settings.json\n!.vscode/tasks.json\n!.vscode/launch.json\n!.vscode/extensions.json\n*.code-workspace\n.history/" },
  { id: "jetbrains", label: "JetBrains (IntelliJ, WebStorm…)", group: "Éditeurs", lines: ".idea/\n*.iml\n*.ipr\n*.iws\nout/\n.idea_modules/" },
  { id: "vim", label: "Vim / Neovim", group: "Éditeurs", lines: "[._]*.s[a-v][a-z]\n[._]*.sw[a-p]\nSession.vim\n.netrwhist\n*~\ntags" },
  { id: "macos", label: "macOS", group: "Systèmes", lines: ".DS_Store\n.AppleDouble\n.LSOverride\n._*\n.Spotlight-V100\n.Trashes\n.fseventsd\n.DocumentRevisions-V100\n.TemporaryItems" },
  { id: "windows", label: "Windows", group: "Systèmes", lines: "Thumbs.db\nThumbs.db:encryptable\nehthumbs.db\nDesktop.ini\n$RECYCLE.BIN/\n*.lnk\n*.stackdump" },
  { id: "linux", label: "Linux", group: "Systèmes", lines: "*~\n.fuse_hidden*\n.directory\n.Trash-*\n.nfs*" },
];

const GROUPS: Group[] = ["Langages", "Frameworks", "Outils", "Éditeurs", "Systèmes"];

export function GitignoreTool() {
  const [selected, setSelected] = useState<string[]>(["node", "react", "env", "vscode", "macos"]);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");
  const [dedupe, setDedupe] = useState(true);

  const output = useMemo(() => {
    const seen = new Set<string>();
    const sections = TEMPLATES.filter((t) => selected.includes(t.id)).map((t) => {
      const lines = t.lines.split("\n").filter((l) => {
        if (!dedupe) return true;
        if (seen.has(l)) return false;
        seen.add(l);
        return true;
      });
      return lines.length ? `### ${t.label} ###\n${lines.join("\n")}` : "";
    });
    if (custom.trim()) sections.push(`### Personnalisé ###\n${custom.trim()}`);
    return sections.filter(Boolean).join("\n\n") + "\n";
  }, [selected, custom, dedupe]);

  const q = query.trim().toLowerCase();
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  function download() {
    const url = URL.createObjectURL(new Blob([output], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = ".gitignore";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Filtrer</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="node, python, jetbrains…" />
        </div>
      </div>
      {GROUPS.map((g) => {
        const items = TEMPLATES.filter((t) => t.group === g && (!q || t.label.toLowerCase().includes(q) || t.id.includes(q)));
        if (!items.length) return null;
        return (
          <div key={g} className="mb-md">
            <div className="row-head" style={{ margin: "0.4rem 0 0.5rem" }}>
              <h2>{g}</h2>
            </div>
            <div className="emoji-groups">
              {items.map((t) => (
                <button key={t.id} type="button" className={"btn" + (selected.includes(t.id) ? " is-active" : "")} aria-pressed={selected.includes(t.id)} onClick={() => toggle(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="bench bench-2 mt-lg">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Règles personnalisées</span>
          </div>
          <textarea value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={"uploads/\n*.sqlite\n!config/default.json"} spellCheck={false} />
          <label className="check-row">
            <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} />
            Supprimer les doublons entre sections
          </label>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">.gitignore</span>
            <span className="meta">{selected.length} modèle{selected.length > 1 ? "s" : ""}</span>
          </div>
          <CodeView code={output} language="text" />
          <div className="panel-tools">
            <CopyButton getText={() => output} />
            <button type="button" className="btn" onClick={download}>
              Télécharger
            </button>
            <button type="button" className="btn" onClick={() => setSelected([])}>
              Tout décocher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
