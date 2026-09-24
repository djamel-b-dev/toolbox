import { useEffect, useMemo, useState } from "react";

const DEFAULT_ZONES = ["UTC", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney"];
const STORAGE_KEY = "toolbox:timezones";

function allZones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  const zones = intl.supportedValuesOf?.("timeZone") ?? DEFAULT_ZONES;
  return zones.includes("UTC") ? zones : ["UTC", ...zones];
}

/** Offset of `zone` at `date`, in minutes east of UTC. */
function offsetMinutes(zone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

function formatOffset(min: number): string {
  const sign = min >= 0 ? "+" : "−";
  const a = Math.abs(min);
  return `UTC${sign}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

/** Interprets a wall-clock "YYYY-MM-DDTHH:mm" as local time in `zone`. */
function zonedToDate(local: string, zone: string): Date | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Two passes handle DST transitions where the first offset guess is off by an hour.
  let ts = guess - offsetMinutes(zone, new Date(guess)) * 60000;
  ts = guess - offsetMinutes(zone, new Date(ts)) * 60000;
  return new Date(ts);
}

function toLocalInput(date: Date, zone: string): string {
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return p.replace(" ", "T");
}

function readZones(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* defaults */
  }
  const mine = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return mine && !DEFAULT_ZONES.includes(mine) ? [mine, ...DEFAULT_ZONES] : DEFAULT_ZONES;
}

export function TimezoneTool() {
  const zones = useMemo(allZones, []);
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [selected, setSelected] = useState<string[]>(readZones);
  const [sourceZone, setSourceZone] = useState(localZone || "UTC");
  const [live, setLive] = useState(true);
  const [value, setValue] = useState(() => toLocalInput(new Date(), localZone || "UTC"));
  const [adding, setAdding] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      /* not persisted */
    }
  }, [selected]);

  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [live]);

  const instant = useMemo(() => (live ? new Date() : zonedToDate(value, sourceZone)), [live, value, sourceZone, tick]);

  const fmt = (zone: string, opts: Intl.DateTimeFormatOptions) => (instant ? new Intl.DateTimeFormat("fr-FR", { timeZone: zone, ...opts }).format(instant) : "—");

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Date et heure</span>
          <input
            className="input"
            type="datetime-local"
            value={live && instant ? toLocalInput(instant, sourceZone) : value}
            onChange={(e) => {
              setLive(false);
              setValue(e.target.value);
            }}
          />
        </div>
        <div className="field">
          <span className="field-label">Dans le fuseau</span>
          <select
            className="input"
            value={sourceZone}
            onChange={(e) => {
              if (live && instant) setValue(toLocalInput(instant, e.target.value));
              setSourceZone(e.target.value);
            }}
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: "none", justifyContent: "flex-end" }}>
          <label className="check-row" style={{ height: 36 }}>
            <input
              type="checkbox"
              checked={live}
              onChange={(e) => {
                if (!e.target.checked && instant) setValue(toLocalInput(instant, sourceZone));
                setLive(e.target.checked);
              }}
            />
            Maintenant (en direct)
          </label>
        </div>
      </div>

      {instant && (
        <div className="hash-rows mb-lg">
          <div className="hash-row">
            <span className="alg">ISO 8601 (UTC)</span>
            <span className="val">{instant.toISOString()}</span>
            <span />
          </div>
          <div className="hash-row">
            <span className="alg">Timestamp Unix</span>
            <span className="val">{Math.floor(instant.getTime() / 1000)}</span>
            <span />
          </div>
        </div>
      )}

      <div className="tz-list">
        {selected.map((zone) => {
          const off = instant ? offsetMinutes(zone, instant) : 0;
          // en-GB gives a bare "07"; fr-FR would format the hour alone as "07 h", which isn't a number.
          const hour = instant ? Number(new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", hourCycle: "h23" }).format(instant)) : 12;
          const night = hour < 7 || hour >= 21;
          const work = hour >= 9 && hour < 18;
          return (
            <div className="tz-row" key={zone}>
              <div className="tz-zone">
                <strong>{zone.split("/").pop()!.replace(/_/g, " ")}</strong>
                <span>
                  {zone} · {formatOffset(off)}
                  {zone === localZone && " · votre fuseau"}
                </span>
              </div>
              <div className="tz-time">
                <strong>{fmt(zone, { hour: "2-digit", minute: "2-digit", second: live ? "2-digit" : undefined, hourCycle: "h23" })}</strong>
                <span>{fmt(zone, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <span className={"tz-badge" + (night ? " night" : work ? " work" : "")}>{night ? "nuit" : work ? "heures ouvrées" : "hors bureau"}</span>
              <button type="button" className="icon-btn" aria-label={`Retirer ${zone}`} onClick={() => setSelected((s) => s.filter((z) => z !== zone))}>
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className="field-row" style={{ marginTop: "1rem" }}>
        <div className="field">
          <span className="field-label">Ajouter un fuseau</span>
          <input className="input" list="tz-options" value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="Europe/Berlin, Asia/Dubai…" />
          <datalist id="tz-options">
            {zones.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </div>
        <div className="field" style={{ flex: "none", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn"
            disabled={!zones.includes(adding) || selected.includes(adding)}
            onClick={() => {
              setSelected((s) => [...s, adding]);
              setAdding("");
            }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
