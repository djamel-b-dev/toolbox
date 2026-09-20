import { useState } from "react";

interface ParsedUA {
  browser: string;
  browserVersion: string;
  os: string;
  device: string;
  engine: string;
}

function parseUA(ua: string): ParsedUA {
  let browser = "Inconnu";
  let browserVersion = "";
  let os = "Inconnu";
  let device = "Ordinateur";
  let engine = "Inconnu";

  const browserPatterns: [RegExp, string][] = [
    [/Edg\/([\d.]+)/, "Edge"],
    [/OPR\/([\d.]+)/, "Opera"],
    [/CriOS\/([\d.]+)/, "Chrome (iOS)"],
    [/FxiOS\/([\d.]+)/, "Firefox (iOS)"],
    [/Chrome\/([\d.]+)/, "Chrome"],
    [/Firefox\/([\d.]+)/, "Firefox"],
    [/Version\/([\d.]+).*Safari/, "Safari"],
  ];
  for (const [re, name] of browserPatterns) {
    const m = ua.match(re);
    if (m) {
      browser = name;
      browserVersion = m[1];
      break;
    }
  }

  const winMatch = ua.match(/Windows NT ([\d.]+)/);
  const macMatch = ua.match(/Mac OS X ([\d_]+)/);
  const androidMatch = ua.match(/Android ([\d.]+)/);
  const iosMatch = ua.match(/iPhone OS ([\d_]+)/);
  const ipadMatch = ua.match(/CPU OS ([\d_]+)/);

  if (winMatch) os = winMatch[1] === "10.0" ? "Windows 10/11" : `Windows NT ${winMatch[1]}`;
  else if (macMatch) os = `macOS ${macMatch[1].replace(/_/g, ".")}`;
  else if (androidMatch) os = `Android ${androidMatch[1]}`;
  else if (iosMatch) os = `iOS ${iosMatch[1].replace(/_/g, ".")}`;
  else if (ipadMatch) os = `iPadOS ${ipadMatch[1].replace(/_/g, ".")}`;
  else if (/Linux/.test(ua)) os = "Linux";

  if (/iPad|Tablet/.test(ua)) device = "Tablette";
  else if (/Mobi|iPhone|Android.*Mobile/.test(ua)) device = "Mobile";

  if (/Firefox/.test(ua)) engine = "Gecko";
  else if (/Chrome|Chromium|Edg|OPR|CriOS/.test(ua)) engine = "Blink";
  else if (/AppleWebKit/.test(ua)) engine = "WebKit";

  return { browser, browserVersion, os, device, engine };
}

export function UserAgentTool() {
  const [ua, setUa] = useState(navigator.userAgent);
  const parsed = parseUA(ua);

  const rows: [string, string][] = [
    ["Navigateur", `${parsed.browser}${parsed.browserVersion ? ` ${parsed.browserVersion}` : ""}`],
    ["Moteur", parsed.engine],
    ["Système", parsed.os],
    ["Appareil", parsed.device],
  ];

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Chaîne User-Agent</span>
        </div>
        <textarea value={ua} onChange={(e) => setUa(e.target.value)} spellCheck={false} style={{ minHeight: 80 }} />
        <div className="panel-tools">
          <button type="button" className="btn" onClick={() => setUa(navigator.userAgent)}>
            Utiliser mon navigateur
          </button>
        </div>
      </div>

      <div className="hash-rows">
        {rows.map(([label, value]) => (
          <div className="hash-row" key={label} style={{ gridTemplateColumns: "1fr auto" }}>
            <span className="alg">{label}</span>
            <span className="val">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
