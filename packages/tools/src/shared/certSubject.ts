export interface SubjectFields {
  cn: string;
  org: string;
  ou: string;
  locality: string;
  state: string;
  country: string;
  email: string;
}

export interface SubjectAttr {
  name?: string;
  shortName?: string;
  value: string;
}

export function buildSubjectAttrs(fields: SubjectFields): SubjectAttr[] {
  const attrs: SubjectAttr[] = [];
  if (fields.cn) attrs.push({ name: "commonName", value: fields.cn });
  if (fields.country) attrs.push({ name: "countryName", value: fields.country });
  if (fields.state) attrs.push({ shortName: "ST", value: fields.state });
  if (fields.locality) attrs.push({ name: "localityName", value: fields.locality });
  if (fields.org) attrs.push({ name: "organizationName", value: fields.org });
  if (fields.ou) attrs.push({ shortName: "OU", value: fields.ou });
  if (fields.email) attrs.push({ name: "emailAddress", value: fields.email });
  return attrs;
}

export type AltName = { type: 2; value: string } | { type: 7; ip: string };

export function randomSerialHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (parseInt(hex[0], 16) >= 8) hex = "00" + hex;
  return hex;
}

export function parseSans(input: string): AltName[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((value): AltName => (/^\d{1,3}(\.\d{1,3}){3}$/.test(value) ? { type: 7, ip: value } : { type: 2, value }));
}
