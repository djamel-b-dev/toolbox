import type { Locale } from "@toolbox/core";
import type { ToolDefinition } from "../types";
import { ES_CATALOG, ES_CATEGORIES } from "./catalog-es";
import { ZH_CATALOG, ZH_CATEGORIES } from "./catalog-zh";
import { JA_CATALOG, JA_CATEGORIES } from "./catalog-ja";

export interface CatalogEntry {
  name: string;
  description: string;
}

/**
 * Translated name/description for each tool, keyed by tool id. `registry.ts`'s
 * `name`/`description` fields are French and stay the source of truth — a
 * locale only needs entries for the tools it has actually translated; anything
 * missing falls back to that French text (see `getToolText` below), so a new
 * language file can start partial and grow over time.
 */
const EN_CATALOG: Record<string, CatalogEntry> = {
  base64: { name: "Base64 Encoder / Decoder", description: "Converts text to and from Base64." },
  hash: { name: "Hash Generator", description: "SHA-1/256/384/512 digests, computed locally." },
  uuid: { name: "UUID Generator", description: "Creates v4 UUIDs on demand." },
  ulid: { name: "ULID Generator", description: "Time-sortable identifiers, encoded in Crockford base32." },
  token: {
    name: "Token Generator",
    description: "Cryptographically secure random strings, with configurable length and alphabet.",
  },
  hmac: { name: "HMAC Generator", description: "Signs a message with a secret key (SHA-1/256/384/512)." },
  jwt: { name: "JWT Decoder", description: "Inspects the header and payload claims." },
  bcrypt: { name: "Bcrypt", description: "Hashes a password or verifies a match." },
  bip39: { name: "BIP-39 Passphrase", description: "Generates a mnemonic passphrase and its derived seed." },
  "rsa-keypair": {
    name: "RSA Key Pair",
    description: "Generates an RSA-OAEP or RSASSA-PKCS1 key pair, in PEM format.",
  },
  aes: { name: "AES Encryption", description: "Encrypts and decrypts text with AES-256-GCM and a passphrase." },
  "password-strength": {
    name: "Password Strength Analyzer",
    description: "Estimates entropy and flags weak patterns in a password.",
  },
  "password-generator": {
    name: "Password Generator",
    description: "Length, character sets and ambiguous-character exclusion, with a strength meter.",
  },

  url: { name: "URL Encoder / Decoder", description: "Encodes strings for use in URLs." },
  "url-parser": { name: "URL Parser", description: "Breaks a URL down into its parts and query parameters." },
  slug: { name: "Slug Generator", description: "Turns a title into a clean URL identifier." },
  "html-entities": { name: "HTML Entities", description: "Encodes and decodes common HTML entities." },
  "basic-auth": {
    name: "Basic Auth Generator",
    description: "Builds the Authorization header from a username and password.",
  },

  json: { name: "JSON Formatter", description: "Formats, minifies and validates JSON." },
  regex: { name: "Regex Tester", description: "Tests a pattern against sample text, with match highlighting." },
  chmod: { name: "chmod Calculator", description: "Converts Unix permissions between octal and symbolic notation." },
  "json-diff": { name: "JSON Comparator", description: "Compares two JSON documents structurally." },
  cron: { name: "Cron Parser", description: "Explains a cron expression in plain language." },
  "sql-formatter": { name: "SQL Formatter", description: "Formats a SQL query (standard, MySQL, PostgreSQL)." },
  "xml-formatter": { name: "XML Formatter", description: "Indents an XML document." },
  "docker-compose": {
    name: "docker run → compose",
    description: "Converts a docker run command into a docker-compose service.",
  },
  "regex-cheatsheet": { name: "Regex Cheatsheet", description: "Quick reference for regular expression syntax." },
  "git-cheatsheet": { name: "Git Cheatsheet", description: "Common Git commands, with description and quick copy." },

  yaml: { name: "JSON ↔ YAML Converter", description: "Converts between JSON and YAML in both directions." },
  toml: { name: "JSON ↔ TOML Converter", description: "Converts between JSON and TOML in both directions." },
  case: { name: "Case Converter", description: "camelCase, snake_case, kebab-case, Title Case and more, at a glance." },
  color: { name: "Color Converter", description: "HEX, RGB, HSL at a glance." },
  "base-converter": { name: "Number Base Converter", description: "Binary, octal, decimal, hexadecimal." },
  roman: { name: "Roman Numerals", description: "Converts between Arabic numbers and Roman numerals." },
  timestamp: { name: "Timestamp Converter", description: "Unix time to and from a calendar date." },
  "list-converter": { name: "List Converter", description: "Cleans, sorts, deduplicates and reformats a list." },
  unicode: { name: "Unicode Converter", description: "Text to Unicode code points, and back." },
  temperature: { name: "Temperature Converter", description: "Celsius, Fahrenheit and Kelvin." },

  percentage: {
    name: "Percentage Calculator",
    description: "Percentage of a value, proportion and change between two numbers.",
  },
  "math-eval": { name: "Expression Evaluator", description: "Evaluates a math expression without ever using eval()." },

  diff: { name: "Text Comparator", description: "Compares two blocks of text line by line." },
  "text-stats": { name: "Text Statistics", description: "Words, characters, lines and estimated reading time." },
  lorem: { name: "Lorem Ipsum Generator", description: "Words, sentences or paragraphs of filler text." },
  nato: { name: "NATO Alphabet", description: "Spells out text using the NATO phonetic alphabet." },
  obfuscator: { name: "Text Obfuscator", description: "Masks part of a sensitive string (card, email…)." },
  numeronym: { name: "Numeronym Generator", description: "Contracts long words, like i18n or a11y." },
  markdown: { name: "Markdown Editor", description: "Create, edit and preview Markdown documents, saved locally." },
  "emoji-picker": { name: "Emoji Picker", description: "Search and copy any Unicode emoji or a kaomoji." },

  subnet: {
    name: "Subnet Calculator",
    description: "Network address, broadcast and host range from CIDR notation.",
  },
  "ipv4-converter": { name: "IPv4 Address Converter", description: "Dotted decimal, integer, hexadecimal and binary." },
  "ipv4-range": { name: "IPv4 Range Expander", description: "Lists every address in a CIDR block." },
  "ipv6-ula": { name: "IPv6 ULA Generator", description: "Random unique local prefix per RFC 4193." },
  "mac-address": { name: "MAC Address Generator", description: "Random MAC address, locally administered or not." },
  "random-port": {
    name: "Random Port Generator",
    description: "Random port within the registered or dynamic range.",
  },

  "email-normalizer": {
    name: "Email Normalizer",
    description: "Normalizes case and strips aliases (+tag, Gmail dots).",
  },
  "device-info": { name: "Device Information", description: "Browser and screen details, read locally." },
  "user-agent": {
    name: "User-Agent Parser",
    description: "Breaks down a User-Agent string into browser, engine, OS and device.",
  },
  "http-status": { name: "HTTP Status Codes", description: "Searchable reference of HTTP status codes." },
  "mime-types": { name: "MIME Types", description: "Searchable reference of MIME types by extension." },
  "meta-tags": {
    name: "Meta Tag Generator",
    description: "Generates Open Graph and Twitter Card tags for the <head>.",
  },

  qrcode: { name: "QR Code Generator", description: "Generates a QR code from text or a URL." },
  "wifi-qrcode": { name: "Wi-Fi QR Code", description: "QR code for automatic Wi-Fi connection." },
  "svg-placeholder": {
    name: "SVG Placeholder",
    description: "Generates an SVG placeholder image at the size you need.",
  },
  "color-blindness": {
    name: "Color Blindness Simulator",
    description: "Previews a color under different types of color blindness.",
  },
  "pixel-art": {
    name: "Pixel Art Generator",
    description: "Draw or generate a pixel art sprite, export it as PNG, SVG or CSS.",
  },

  csr: { name: "CSR Generator", description: "Generates a private key and a certificate signing request (PKCS#10)." },
  "self-signed-cert": {
    name: "Self-Signed Certificate",
    description: "Generates a private key and a self-signed X.509 certificate.",
  },
  "cert-reader": {
    name: "Certificate Reader",
    description: "Decodes a PEM certificate: subject, issuer, validity, SAN, fingerprints.",
  },
  pfx: {
    name: "PFX / PKCS#12 Bundler",
    description: "Combines a certificate and key into a .pfx, or extracts an existing .pfx.",
  },
  "pem-der": { name: "PEM ↔ DER Converter", description: "Converts a PEM block to DER (hex/base64) and back." },

  "ai-chat": {
    name: "AI Chat",
    description: "Streams a conversation with the chat API of your choice — URL and headers configurable.",
  },

  iban: { name: "IBAN Validator", description: "Checks an IBAN's check digits and formats it." },
  "json-csv": { name: "JSON ↔ CSV Converter", description: "Converts a JSON array to CSV and back, with object flattening and a table preview." },
  "xml-json": { name: "XML ↔ JSON Converter", description: "Turns XML into JSON (attributes, repeated elements, text) and JSON into XML." },
  "json-to-ts": { name: "JSON → Classes & Types", description: "Generates classes and types matching a JSON document: TypeScript, C#, Python, Java, Go, Rust, Kotlin, Swift." },
  "string-escape": { name: "String Escaper", description: "Escapes and unescapes text for JSON, JavaScript, HTML, XML, SQL, shell, regex, URL, CSV and Unicode." },
  semver: { name: "SemVer Comparator", description: "Compares semantic versions, tests npm ranges (^, ~, ||) and sorts a list." },
  "hex-viewer": { name: "Hex Viewer", description: "Shows a file or text as hex and ASCII, with file-type detection and SHA-256." },
  totp: { name: "TOTP / 2FA Generator", description: "One-time codes (RFC 6238) compatible with Google Authenticator, with an otpauth QR code." },
  timezone: { name: "Time Zone Converter", description: "Shows a date and time across several time zones at once, business hours included." },
  "data-size": { name: "Data Sizes & Transfer Rates", description: "Converts bytes, KB/KiB, MB/MiB… and estimates transfer times for a given bandwidth." },
  ports: { name: "Common Network Ports", description: "Searchable reference of TCP/UDP ports: web, databases, VPN, Kubernetes…" },
  "image-converter": { name: "Image Converter", description: "Resizes and converts an image to PNG, JPEG or WEBP, and exports it as a data URI." },
  keycode: { name: "Keyboard Info (keycode)", description: "Shows key, code, keyCode and modifiers for every key you press." },
  jsonpath: { name: "JSONPath Query", description: "Queries a JSON document with a JSONPath expression (filters, recursive descent) and shows the result as a tree." },
  gitignore: { name: ".gitignore Generator", description: "Builds a .gitignore from templates for languages, frameworks, tools, editors and operating systems." },
  "security-headers": { name: "HTTP Security Headers Analyzer", description: "Grades an HTTP response's headers (CSP, HSTS, cookies, CORS…) and suggests fixes." },
  "cli-builder": { name: "openssl, ssh & curl Command Builder", description: "Builds the right command for common tasks: CSRs, certificates, SSH keys, tunnels, HTTP requests." },
  "env-converter": { name: "Environment Variables Converter", description: "Converts .env, JSON, YAML, Kubernetes (env, ConfigMap, Secret), docker run -e, compose, bash and PowerShell." },
  "curl-converter": { name: "curl → Code", description: "Turns a curl command into fetch, axios, Python requests, Go, PHP or PowerShell code." },
  "git-diff": { name: "Git Diff Viewer", description: "Displays a unified patch (git diff) side by side or unified, file by file." },
  "binary-decoder": { name: "Protobuf / MessagePack / CBOR Decoder", description: "Decodes binary bytes (hex or base64) into a readable JSON tree, including schemaless Protobuf." },
  "fake-data": { name: "Fake Data Generator", description: "Realistic test datasets (names, emails, addresses, IBANs…) as JSON, CSV or SQL INSERT." },
  "json-schema": { name: "JSON Schema Validator", description: "Validates a document against a JSON Schema (draft-07 to 2020-12) and generates a schema from a sample." },
  "cron-builder": { name: "Crontab Builder", description: "Builds a cron expression by clicking and shows the next run times." },
  vlsm: { name: "VLSM Calculator", description: "Splits a network into subnets of different sizes based on the number of hosts needed." },
  "cert-chain": { name: "Certificate Chain Checker", description: "Reorders a certificate chain and checks signatures, dates, issuers and hostname." },
  "ssh-keygen": { name: "SSH Key Generator", description: "Generates an Ed25519 or RSA key pair in OpenSSH format, with fingerprint and randomart." },
  "email-auth": { name: "SPF / DMARC / DKIM Analyzer", description: "Explains an SPF, DMARC or DKIM record and flags configuration mistakes." },
  "table-converter": { name: "Table Converter", description: "Converts tables between CSV, Excel, Markdown, HTML, JSON, ASCII, LaTeX and Jira." },
  "text-cleaner": { name: "Text Cleaner", description: "Reveals and removes invisible characters, bidi controls, non-breaking spaces and mixed line endings." },
  mojibake: { name: "Encoding Repair (Mojibake)", description: "Fixes badly decoded text like “Ã©” → “é” and shows its bytes." },
  favicon: { name: "Favicon Generator", description: "Creates every favicon size, the .ico, the manifest and the HTML snippet, from an image or an emoji." },
  exif: { name: "EXIF Viewer", description: "Shows a photo's metadata (camera, GPS…) and strips it before sharing." },
  "css-generator": { name: "CSS Generator", description: "Gradients, box shadows and border radius with a live preview and ready-to-copy CSS." },
  "db-connection": { name: "Database Connection Strings", description: "Builds, parses and converts PostgreSQL, MySQL, SQL Server, Oracle, MongoDB, Redis and SQLite connection strings." },
};

const AR_CATALOG: Record<string, CatalogEntry> = {
  base64: { name: "ترميز/فك ترميز Base64", description: "يحوّل النص من وإلى Base64." },
  hash: { name: "مولّد البصمات (Hash)", description: "بصمات SHA-1/256/384/512، تُحسب محليًا." },
  uuid: { name: "مولّد UUID", description: "ينشئ معرّفات UUID من الإصدار 4 عند الطلب." },
  ulid: { name: "مولّد ULID", description: "معرّفات قابلة للترتيب زمنيًا، مُرمّزة بصيغة Crockford base32." },
  token: {
    name: "مولّد الرموز (Token)",
    description: "سلاسل عشوائية آمنة تشفيريًا، بطول وأبجدية قابلين للتخصيص.",
  },
  hmac: { name: "مولّد HMAC", description: "يوقّع رسالة بمفتاح سرّي (SHA-1/256/384/512)." },
  jwt: { name: "محلّل JWT", description: "يفحص ترويسة الحمولة (payload) ومطالباتها." },
  bcrypt: { name: "Bcrypt", description: "يُشفّر كلمة مرور أو يتحقّق من تطابقها." },
  bip39: { name: "عبارة استرداد BIP-39", description: "يولّد عبارة استرداد تذكارية (mnemonic) والبذرة المشتقة منها." },
  "rsa-keypair": {
    name: "زوج مفاتيح RSA",
    description: "يولّد زوج مفاتيح RSA-OAEP أو RSASSA-PKCS1، بصيغة PEM.",
  },
  aes: { name: "تشفير AES", description: "يشفّر ويفكّ تشفير نص باستخدام AES-256-GCM وعبارة سرّية." },
  "password-strength": {
    name: "محلّل قوة كلمة المرور",
    description: "يقدّر الإنتروبيا ويكتشف الأنماط الضعيفة في كلمة المرور.",
  },
  "password-generator": {
    name: "مولّد كلمات المرور",
    description: "الطول، مجموعات الأحرف، واستبعاد الأحرف الملتبسة، مع مؤشر للقوة.",
  },

  url: { name: "ترميز/فك ترميز URL", description: "يرمّز السلاسل النصية لاستخدامها في الروابط." },
  "url-parser": { name: "محلّل URL", description: "يفكّك رابطًا إلى أجزائه ومعاملات الاستعلام الخاصة به." },
  slug: { name: "مولّد Slug", description: "يحوّل عنوانًا إلى معرّف رابط نظيف." },
  "html-entities": { name: "كيانات HTML", description: "يرمّز ويفك ترميز كيانات HTML الشائعة." },
  "basic-auth": {
    name: "مولّد Basic Auth",
    description: "يبني ترويسة Authorization من اسم مستخدم وكلمة مرور.",
  },

  json: { name: "منسّق JSON", description: "ينسّق ويصغّر ويتحقق من صحة JSON." },
  regex: { name: "مختبر التعابير النمطية", description: "يختبر نمطًا على نص عيّنة، مع تمييز التطابقات." },
  chmod: { name: "حاسبة chmod", description: "يحوّل أذونات Unix بين الترميز الثماني والرمزي." },
  "json-diff": { name: "مقارن JSON", description: "يقارن مستندي JSON من الناحية البنيوية." },
  cron: { name: "محلّل Cron", description: "يشرح تعبير cron بلغة واضحة." },
  "sql-formatter": { name: "منسّق SQL", description: "ينسّق استعلام SQL (قياسي، MySQL، PostgreSQL)." },
  "xml-formatter": { name: "منسّق XML", description: "يُنسّق مستند XML بمسافات بادئة." },
  "docker-compose": {
    name: "docker run → compose",
    description: "يحوّل أمر docker run إلى خدمة docker-compose.",
  },
  "regex-cheatsheet": { name: "مرجع سريع للتعابير النمطية", description: "مرجع سريع لصيغة التعابير النمطية (Regex)." },
  "git-cheatsheet": { name: "مرجع سريع لـ Git", description: "أوامر Git الشائعة، مع الوصف والنسخ السريع." },

  yaml: { name: "محوّل JSON ↔ YAML", description: "يحوّل بين JSON وYAML في الاتجاهين." },
  toml: { name: "محوّل JSON ↔ TOML", description: "يحوّل بين JSON وTOML في الاتجاهين." },
  case: { name: "محوّل حالة الأحرف", description: "camelCase وsnake_case وkebab-case وTitle Case وغيرها، بلمحة واحدة." },
  color: { name: "محوّل الألوان", description: "HEX وRGB وHSL بلمحة واحدة." },
  "base-converter": { name: "محوّل الأساس العددي", description: "ثنائي، ثماني، عشري، وست عشري." },
  roman: { name: "الأرقام الرومانية", description: "يحوّل بين الأرقام العربية والأرقام الرومانية." },
  timestamp: { name: "محوّل الطابع الزمني", description: "الوقت من نوع Unix من وإلى تاريخ تقويمي." },
  "list-converter": { name: "محوّل القوائم", description: "ينظّف القائمة ويرتّبها ويزيل التكرار ويعيد تنسيقها." },
  unicode: { name: "محوّل Unicode", description: "من النص إلى نقاط ترميز Unicode، والعكس." },
  temperature: { name: "محوّل درجة الحرارة", description: "مئوية وفهرنهايت وكلفن." },

  percentage: {
    name: "حاسبة النسبة المئوية",
    description: "النسبة المئوية لقيمة، والتناسب، والتغيّر بين رقمين.",
  },
  "math-eval": { name: "مقيّم التعابير الرياضية", description: "يحسب تعبيرًا رياضيًا دون استخدام ()eval إطلاقًا." },

  diff: { name: "مقارن النصوص", description: "يقارن كتلتي نص سطرًا بسطر." },
  "text-stats": { name: "إحصاءات النص", description: "الكلمات والأحرف والأسطر ووقت القراءة المقدّر." },
  lorem: { name: "مولّد Lorem Ipsum", description: "كلمات أو جمل أو فقرات من نص حشو." },
  nato: { name: "أبجدية الناتو الصوتية", description: "يتهجّى نصًا باستخدام أبجدية الناتو الصوتية." },
  obfuscator: { name: "إخفاء النص", description: "يخفي جزءًا من سلسلة حساسة (بطاقة، بريد إلكتروني…)." },
  numeronym: { name: "مولّد Numeronym", description: "يختصر الكلمات الطويلة، مثل i18n أو a11y." },
  markdown: { name: "محرّر Markdown", description: "أنشئ وحرّر واعرض مستندات Markdown، محفوظة محليًا." },
  "emoji-picker": { name: "منتقي الإيموجي", description: "ابحث عن أي إيموجي أو كاوموجي وانسخه." },

  subnet: {
    name: "حاسبة الشبكة الفرعية",
    description: "عنوان الشبكة والبث ونطاق المضيفين من ترميز CIDR.",
  },
  "ipv4-converter": { name: "محوّل عنوان IPv4", description: "عشري منقوط، عدد صحيح، ست عشري، وثنائي." },
  "ipv4-range": { name: "موسّع نطاق IPv4", description: "يسرد جميع عناوين كتلة CIDR." },
  "ipv6-ula": { name: "مولّد IPv6 ULA", description: "بادئة محلية فريدة عشوائية وفق RFC 4193." },
  "mac-address": { name: "مولّد عنوان MAC", description: "عنوان MAC عشوائي، مُدار محليًا أو لا." },
  "random-port": {
    name: "مولّد منفذ عشوائي",
    description: "منفذ عشوائي ضمن النطاق المسجّل أو الديناميكي.",
  },

  "email-normalizer": {
    name: "موحّد البريد الإلكتروني",
    description: "يوحّد حالة الأحرف ويزيل الأسماء المستعارة (+tag، نقاط Gmail).",
  },
  "device-info": { name: "معلومات الجهاز", description: "تفاصيل المتصفح والشاشة، تُقرأ محليًا." },
  "user-agent": {
    name: "محلّل User-Agent",
    description: "يفكّك سلسلة User-Agent إلى المتصفح والمحرّك ونظام التشغيل والجهاز.",
  },
  "http-status": { name: "رموز حالة HTTP", description: "مرجع قابل للبحث لرموز حالة HTTP." },
  "mime-types": { name: "أنواع MIME", description: "مرجع قابل للبحث لأنواع MIME حسب الامتداد." },
  "meta-tags": {
    name: "مولّد وسوم Meta",
    description: "يولّد وسوم Open Graph وTwitter Card للـ <head>.",
  },

  qrcode: { name: "مولّد رمز QR", description: "يولّد رمز QR من نص أو رابط." },
  "wifi-qrcode": { name: "رمز QR لشبكة Wi-Fi", description: "رمز QR للاتصال التلقائي بشبكة Wi-Fi." },
  "svg-placeholder": {
    name: "بديل SVG",
    description: "يولّد صورة بديلة بصيغة SVG بالأبعاد المطلوبة.",
  },
  "pixel-art": {
    name: "مولّد فن البكسل",
    description: "ارسم أو ولّد رسمة بكسل وصدّرها بصيغة PNG أو SVG أو CSS.",
  },
  "color-blindness": {
    name: "محاكي عمى الألوان",
    description: "يعاين لونًا وفق أنواع مختلفة من عمى الألوان.",
  },

  csr: { name: "مولّد CSR", description: "يولّد مفتاحًا خاصًا وطلب توقيع شهادة (PKCS#10)." },
  "self-signed-cert": {
    name: "شهادة موقّعة ذاتيًا",
    description: "يولّد مفتاحًا خاصًا وشهادة X.509 موقّعة ذاتيًا.",
  },
  "cert-reader": {
    name: "قارئ الشهادات",
    description: "يفكّ ترميز شهادة PEM: الموضوع، المُصدر، الصلاحية، SAN، البصمات.",
  },
  pfx: {
    name: "مُجمّع PFX / PKCS#12",
    description: "يجمع شهادة ومفتاحًا في ملف ‎.pfx، أو يستخرج من ملف ‎.pfx موجود.",
  },
  "pem-der": { name: "محوّل PEM ↔ DER", description: "يحوّل كتلة PEM إلى DER (سادس عشري/Base64) والعكس." },

  "ai-chat": {
    name: "محادثة الذكاء الاصطناعي",
    description: "يبثّ محادثة مع واجهة API للدردشة من اختيارك — الرابط والترويسات قابلة للتخصيص.",
  },

  iban: { name: "التحقق من IBAN", description: "يتحقق من رقم التحقق (check digits) لـ IBAN وينسّقه." },
  "json-csv": { name: "محوّل JSON ↔ CSV", description: "يحوّل مصفوفة JSON إلى CSV والعكس، مع تسطيح الكائنات ومعاينة جدولية." },
  "xml-json": { name: "محوّل XML ↔ JSON", description: "يحوّل XML إلى JSON (السمات، العناصر المتكررة، النص) وJSON إلى XML." },
  "json-to-ts": { name: "JSON ← أصناف وأنواع", description: "يولّد الأصناف والأنواع المطابقة لمستند JSON: TypeScript, C#, Python, Java, Go, Rust, Kotlin, Swift." },
  "string-escape": { name: "تهريب السلاسل النصية", description: "يهرّب النص ويفك تهريبه لـ JSON وJavaScript وHTML وXML وSQL وShell والتعابير النمطية وURL وCSV وUnicode." },
  semver: { name: "مقارنة SemVer", description: "يقارن الإصدارات الدلالية ويختبر نطاقات npm (^ و~ و||) ويرتّب قائمة." },
  "hex-viewer": { name: "عارض سداسي عشري", description: "يعرض ملفًا أو نصًا بالنظام السداسي عشر وASCII، مع كشف نوع الملف وSHA-256." },
  totp: { name: "مولّد TOTP / المصادقة الثنائية", description: "رموز لمرة واحدة (RFC 6238) متوافقة مع Google Authenticator، مع رمز QR بصيغة otpauth." },
  timezone: { name: "محوّل المناطق الزمنية", description: "يعرض تاريخًا ووقتًا في عدة مناطق زمنية معًا، مع ساعات العمل." },
  "data-size": { name: "أحجام البيانات وسرعات النقل", description: "يحوّل البايت وKB/KiB وMB/MiB… ويقدّر زمن النقل حسب السرعة." },
  ports: { name: "منافذ الشبكة الشائعة", description: "مرجع قابل للبحث لمنافذ TCP/UDP: الويب، قواعد البيانات، VPN، Kubernetes…" },
  "image-converter": { name: "محوّل الصور", description: "يغيّر حجم الصورة ويحوّلها إلى PNG أو JPEG أو WEBP ويصدّرها بصيغة data URI." },
  keycode: { name: "معلومات لوحة المفاتيح (keycode)", description: "يعرض key وcode وkeyCode ومفاتيح التعديل لكل مفتاح تضغطه." },
  jsonpath: { name: "استعلامات JSONPath", description: "يستعلم عن مستند JSON بتعبير JSONPath (مرشحات، بحث متداخل) ويعرض النتيجة على شكل شجرة." },
  gitignore: { name: "مولّد ‎.gitignore", description: "يجمع ملف ‎.gitignore من قوالب حسب اللغة والإطار والأداة والمحرر ونظام التشغيل." },
  "security-headers": { name: "محلّل ترويسات أمان HTTP", description: "يقيّم ترويسات استجابة HTTP (CSP وHSTS وملفات تعريف الارتباط وCORS…) ويقترح التصحيحات." },
  "cli-builder": { name: "مولّد أوامر openssl وssh وcurl", description: "يبني الأمر الصحيح للمهام الشائعة: CSR، الشهادات، مفاتيح SSH، الأنفاق، طلبات HTTP." },
  "env-converter": { name: "محوّل متغيرات البيئة", description: "يحوّل بين ‎.env وJSON وYAML وKubernetes (env وConfigMap وSecret) وdocker run -e وcompose وbash وPowerShell." },
  "curl-converter": { name: "curl ← شيفرة", description: "يحوّل أمر curl إلى شيفرة fetch أو axios أو Python requests أو Go أو PHP أو PowerShell." },
  "git-diff": { name: "عارض فروقات Git", description: "يعرض ملف ترقيع موحّد (git diff) جنبًا إلى جنب أو بشكل موحّد، ملفًا تلو الآخر." },
  "binary-decoder": { name: "مفكّك Protobuf / MessagePack / CBOR", description: "يفك ترميز البايتات الثنائية (hex أو base64) إلى شجرة JSON مقروءة، بما في ذلك Protobuf دون مخطط." },
  "fake-data": { name: "مولّد بيانات وهمية", description: "مجموعات بيانات اختبار واقعية (أسماء، بريد، عناوين، IBAN…) بصيغة JSON أو CSV أو SQL INSERT." },
  "json-schema": { name: "مدقّق JSON Schema", description: "يتحقق من مستند وفق مخطط JSON (من draft-07 إلى 2020-12) ويولّد مخططًا من مثال." },
  "cron-builder": { name: "منشئ Crontab", description: "يبني تعبير cron بالنقر ويعرض مواعيد التشغيل القادمة." },
  vlsm: { name: "حاسبة VLSM", description: "يقسّم شبكة إلى شبكات فرعية بأحجام مختلفة حسب عدد الأجهزة المطلوبة." },
  "cert-chain": { name: "مدقّق سلسلة الشهادات", description: "يعيد ترتيب سلسلة الشهادات ويتحقق من التواقيع والتواريخ والجهات المصدرة واسم المضيف." },
  "ssh-keygen": { name: "مولّد مفاتيح SSH", description: "يولّد زوج مفاتيح Ed25519 أو RSA بصيغة OpenSSH مع البصمة وrandomart." },
  "email-auth": { name: "محلّل SPF / DMARC / DKIM", description: "يشرح سجل SPF أو DMARC أو DKIM وينبّه إلى أخطاء الإعداد." },
  "table-converter": { name: "محوّل الجداول", description: "يحوّل الجداول بين CSV وExcel وMarkdown وHTML وJSON وASCII وLaTeX وJira." },
  "text-cleaner": { name: "منظّف النصوص", description: "يكشف ويزيل المحارف غير المرئية وعناصر التحكم في الاتجاه والمسافات غير القابلة للكسر ونهايات الأسطر المختلطة." },
  mojibake: { name: "مصلح الترميز (Mojibake)", description: "يصلح النصوص المفكوكة خطأً مثل «Ã©» ← «é» ويعرض بايتاتها." },
  favicon: { name: "مولّد الأيقونات المفضلة (Favicon)", description: "ينشئ كل أحجام الأيقونة وملف ‎.ico والـ manifest وشيفرة HTML من صورة أو إيموجي." },
  exif: { name: "عارض EXIF", description: "يعرض البيانات الوصفية للصورة (الكاميرا، GPS…) ويحذفها قبل المشاركة." },
  "css-generator": { name: "مولّد CSS", description: "تدرجات لونية وظلال وزوايا مستديرة مع معاينة مباشرة وشيفرة CSS جاهزة للنسخ." },
  "db-connection": { name: "سلاسل الاتصال بقواعد البيانات", description: "ينشئ ويحلّل ويحوّل سلاسل الاتصال لـ PostgreSQL وMySQL وSQL Server وOracle وMongoDB وRedis وSQLite." },
};

const CATALOG_TRANSLATIONS: Partial<Record<Locale, Record<string, CatalogEntry>>> = {
  en: EN_CATALOG,
  es: ES_CATALOG,
  ar: AR_CATALOG,
  zh: ZH_CATALOG,
  ja: JA_CATALOG,
};

/** Category ids are free-form strings in French (the app's base language); translate the label only. */
const CATEGORY_LABELS: Partial<Record<Locale, Record<string, string>>> = {
  en: { Certificats: "Certificates", IA: "AI" },
  es: ES_CATEGORIES,
  zh: ZH_CATEGORIES,
  ja: JA_CATEGORIES,
  ar: {
    Crypto: "التشفير",
    Web: "الويب",
    Development: "التطوير",
    Converter: "التحويل",
    Math: "الرياضيات",
    Text: "النص",
    Network: "الشبكة",
    Images: "الصور",
    Certificats: "الشهادات",
    IA: "الذكاء الاصطناعي",
    Data: "البيانات",
  },
};

/** Falls back to the tool's (French) `name`/`description` when the locale has no entry for it yet. */
export function getToolText(tool: Pick<ToolDefinition, "id" | "name" | "description">, locale: Locale): CatalogEntry {
  const entry = CATALOG_TRANSLATIONS[locale]?.[tool.id];
  return entry ?? { name: tool.name, description: tool.description };
}

/** Falls back to the raw category id (its French label) when untranslated. */
export function getCategoryLabel(category: string, locale: Locale): string {
  return CATEGORY_LABELS[locale]?.[category] ?? category;
}
