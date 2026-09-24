import { useMemo, useState } from "react";
import { CopyButton } from "@toolbox/ui";
import { parseIp, toIp } from "../shared/ipv4";

interface Need {
  name: string;
  hosts: number;
}
interface Alloc extends Need {
  prefix: number;
  network: number;
  size: number;
}

const maskOf = (prefix: number) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);

function allocate(base: number, basePrefix: number, needs: Need[]): { allocs: Alloc[]; error: string; used: number } {
  const total = 2 ** (32 - basePrefix);
  let cursor = base;
  const allocs: Alloc[] = [];
  // Largest first, so every block stays aligned on its own size without gaps.
  for (const n of [...needs].sort((a, b) => b.hosts - a.hosts)) {
    if (n.hosts < 1) continue;
    // /31 and /32 have no network/broadcast overhead (RFC 3021), handy for point-to-point links.
    const size = n.hosts === 1 ? 1 : n.hosts === 2 ? 2 : 2 ** Math.ceil(Math.log2(n.hosts + 2));
    const prefix = 32 - Math.log2(size);
    if (cursor % size !== 0) cursor = Math.ceil(cursor / size) * size;
    if (cursor + size > base + total) return { allocs, error: `Plus assez d'adresses pour « ${n.name} » (${n.hosts} hôtes) dans le /${basePrefix}.`, used: cursor - base };
    allocs.push({ ...n, prefix, network: cursor, size });
    cursor += size;
  }
  return { allocs, error: "", used: cursor - base };
}

const EXAMPLE: Need[] = [
  { name: "Utilisateurs", hosts: 100 },
  { name: "Serveurs", hosts: 50 },
  { name: "Wi-Fi invités", hosts: 25 },
  { name: "Imprimantes", hosts: 12 },
  { name: "Administration", hosts: 6 },
  { name: "Lien routeur", hosts: 2 },
];

export function VlsmTool() {
  const [cidr, setCidr] = useState("192.168.10.0/24");
  const [needs, setNeeds] = useState<Need[]>(EXAMPLE);

  const result = useMemo(() => {
    const m = cidr.trim().match(/^([\d.]+)\/(\d{1,2})$/);
    const ip = m ? parseIp(m[1]) : null;
    const prefix = m ? Number(m[2]) : NaN;
    if (ip === null || !(prefix >= 0 && prefix <= 32)) return { error: "Réseau invalide : utilisez la notation CIDR, ex. 10.0.0.0/16.", allocs: [] as Alloc[], base: 0, prefix: 0, used: 0 };
    const base = (ip & maskOf(prefix)) >>> 0;
    return { ...allocate(base, prefix, needs), base, prefix };
  }, [cidr, needs]);

  const total = 2 ** (32 - result.prefix);
  const text = result.allocs
    .map((a) => `${a.name}\t${toIp(a.network)}/${a.prefix}\t${toIp(maskOf(a.prefix))}\t${a.size > 2 ? `${toIp(a.network + 1)} - ${toIp(a.network + a.size - 2)}` : `${toIp(a.network)} - ${toIp(a.network + a.size - 1)}`}\t${toIp(a.network + a.size - 1)}`)
    .join("\n");

  const update = (i: number, patch: Partial<Need>) => setNeeds((ns) => ns.map((n, k) => (k === i ? { ...n, ...patch } : n)));

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Réseau à découper</span>
          <input className="input" value={cidr} onChange={(e) => setCidr(e.target.value)} />
        </div>
      </div>
      <div className="panel mb-lg" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Sous-réseaux demandés</span>
          <span className="meta">hôtes utilisables par sous-réseau</span>
        </div>
        <div className="fake-fields">
          {needs.map((n, i) => (
            <div className="fake-field" key={i}>
              <input className="input" value={n.name} onChange={(e) => update(i, { name: e.target.value })} aria-label="Nom du sous-réseau" />
              <input className="input" type="number" min={1} value={n.hosts} onChange={(e) => update(i, { hosts: Number(e.target.value) })} aria-label="Nombre d'hôtes" />
              <button type="button" className="icon-btn" aria-label={`Retirer ${n.name}`} onClick={() => setNeeds((ns) => ns.filter((_, k) => k !== i))}>
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="panel-tools">
          <button type="button" className="btn" onClick={() => setNeeds((ns) => [...ns, { name: `Réseau ${ns.length + 1}`, hosts: 10 }])}>
            + Ajouter un sous-réseau
          </button>
        </div>
      </div>

      {result.error && <p className="validation bad mb-lg">{result.error}</p>}

      {result.allocs.length > 0 && (
        <>
          <div className="vlsm-bar mb-md" aria-hidden="true">
            {result.allocs.map((a, i) => (
              <span key={i} style={{ left: `${((a.network - result.base) / total) * 100}%`, width: `${(a.size / total) * 100}%`, background: `hsl(${(i * 67) % 360} 65% 55%)` }} title={`${a.name} ${toIp(a.network)}/${a.prefix}`} />
            ))}
          </div>
          <p className="row-head hint" style={{ margin: "0 0 .75rem" }}>
            {result.used} / {total} adresses allouées ({Math.round((result.used / total) * 100)} %) · {total - result.used} libres
          </p>
          <div className="data-table-wrap mb-md">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Demandés</th>
                  <th>Réseau</th>
                  <th>Masque</th>
                  <th>Plage utilisable</th>
                  <th>Broadcast</th>
                  <th>Capacité</th>
                </tr>
              </thead>
              <tbody>
                {result.allocs.map((a, i) => {
                  const usable = a.size > 2 ? a.size - 2 : a.size;
                  return (
                    <tr key={i}>
                      <td>
                        <span className="vlsm-dot" style={{ background: `hsl(${(i * 67) % 360} 65% 55%)` }} />
                        {a.name}
                      </td>
                      <td>{a.hosts}</td>
                      <td>
                        {toIp(a.network)}/{a.prefix}
                      </td>
                      <td>{toIp(maskOf(a.prefix))}</td>
                      <td>{a.size > 2 ? `${toIp(a.network + 1)} – ${toIp(a.network + a.size - 2)}` : `${toIp(a.network)} – ${toIp(a.network + a.size - 1)}`}</td>
                      <td>{a.size > 2 ? toIp(a.network + a.size - 1) : "—"}</td>
                      <td>
                        {usable} <span style={{ color: "var(--text-tertiary)" }}>({usable - a.hosts} en réserve)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <CopyButton getText={() => text} label="Copier (tabulé)" />
        </>
      )}
    </div>
  );
}
