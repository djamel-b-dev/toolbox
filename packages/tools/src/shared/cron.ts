const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function namedList(field: string, names: string[], offset = 0): string {
  const name = (v: string) => {
    const n = Number(v);
    // Cron accepts 7 as Sunday too.
    return Number.isInteger(n) && names[(n - offset) % names.length] ? names[(n - offset) % names.length] : v;
  };
  const parts = field.split(",").map((part) => {
    const range = part.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
    if (range) return `${range[3] ? `un sur ${range[3]} ` : ""}du ${name(range[1])} au ${name(range[2])}`;
    return name(part);
  });
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}` : parts[0];
}

/** "le lundi", "du lundi au vendredi" — ranges already carry their own article. */
function dayPhrase(field: string, names: string[], offset = 0): string {
  const text = namedList(field, names, offset);
  return text.startsWith("du ") || text.startsWith("un sur") ? text : `le ${text}`;
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "Une expression cron doit contenir 5 champs séparés par des espaces : minute heure jour mois jour-de-semaine.";
  const [min, hour, dom, month, dow] = parts;

  const minIsNum = /^\d+$/.test(min);
  const hourIsNum = /^\d+$/.test(hour);

  let timePart: string;
  if (minIsNum && hourIsNum) {
    timePart = `à ${hour.padStart(2, "0")}h${min.padStart(2, "0")}`;
  } else if (/^\*\/\d+$/.test(min) && hour === "*") {
    timePart = `toutes les ${min.slice(2)} minutes`;
  } else if (min === "0" && /^\*\/\d+$/.test(hour)) {
    timePart = `toutes les ${hour.slice(2)} heures`;
  } else if (min === "*" && hour === "*") {
    timePart = "chaque minute";
  } else if (minIsNum && hour === "*") {
    timePart = min === "0" ? "toutes les heures pile" : `à la minute ${min} de chaque heure`;
  } else if (minIsNum && /^\d+-\d+$/.test(hour)) {
    timePart = `à la minute ${min} de chaque heure, de ${hour.split("-")[0]}h à ${hour.split("-")[1]}h`;
  } else if (minIsNum && /^[\d,]+$/.test(hour)) {
    timePart = `à ${hour.split(",").map((h) => `${h.padStart(2, "0")}h${min.padStart(2, "0")}`).join(", ")}`;
  } else {
    timePart = `à la minute ${min} de l'heure ${hour}`;
  }

  let dayPart: string;
  if (dom === "*" && dow === "*") {
    dayPart = "tous les jours";
  } else if (dom !== "*" && dow === "*") {
    dayPart = /^\*\/\d+$/.test(dom) ? `tous les ${dom.slice(2)} jours` : `le ${dom} du mois`;
  } else if (dom === "*" && dow !== "*") {
    dayPart = dayPhrase(dow, WEEKDAYS);
  } else {
    dayPart = `le ${dom} du mois et ${dayPhrase(dow, WEEKDAYS)}`;
  }

  const monthPart = month === "*" ? "" : ` en ${namedList(month, MONTHS, 1)}`;

  return `${capitalize(timePart)}, ${dayPart}${monthPart}.`;
}
