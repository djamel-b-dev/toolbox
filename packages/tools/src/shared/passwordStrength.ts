const COMMON = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "111111",
  "123123", "admin", "letmein", "welcome", "iloveyou", "azerty",
]);

export const STRENGTH_LABELS = ["Très faible", "Faible", "Moyen", "Fort", "Très fort"];
export const STRENGTH_COLORS = ["var(--danger)", "var(--danger)", "#c8963e", "var(--success)", "var(--success)"];

export interface StrengthResult {
  entropy: number;
  level: number;
  isCommon: boolean;
  hasSequential: boolean;
  hasRepeat: boolean;
  pool: number;
}

export function analyzeStrength(pw: string): StrengthResult {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32;
  const entropy = pw.length * Math.log2(pool || 1);
  const isCommon = COMMON.has(pw.toLowerCase());
  const hasSequential = /(abc|bcd|cde|def|123|234|345|456|567|678|789|890)/i.test(pw);
  const hasRepeat = /(.)\1{2,}/.test(pw);
  let score = entropy;
  if (isCommon) score -= 40;
  if (hasSequential) score -= 10;
  if (hasRepeat) score -= 10;
  score = Math.max(0, score);

  let level: number;
  if (score < 28) level = 0;
  else if (score < 36) level = 1;
  else if (score < 60) level = 2;
  else if (score < 80) level = 3;
  else level = 4;

  return { entropy, level, isCommon, hasSequential, hasRepeat, pool };
}
