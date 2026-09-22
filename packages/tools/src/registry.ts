import { lazy } from "react";
import type { ToolDefinition } from "./types";

const Base64Tool = lazy(() => import("./base64/Base64Tool").then((m) => ({ default: m.Base64Tool })));
const HashTool = lazy(() => import("./hash/HashTool").then((m) => ({ default: m.HashTool })));
const UuidTool = lazy(() => import("./uuid/UuidTool").then((m) => ({ default: m.UuidTool })));
const UlidTool = lazy(() => import("./ulid/UlidTool").then((m) => ({ default: m.UlidTool })));
const TokenTool = lazy(() => import("./token/TokenTool").then((m) => ({ default: m.TokenTool })));
const HmacTool = lazy(() => import("./hmac/HmacTool").then((m) => ({ default: m.HmacTool })));
const JwtTool = lazy(() => import("./jwt/JwtTool").then((m) => ({ default: m.JwtTool })));
const UrlTool = lazy(() => import("./url/UrlTool").then((m) => ({ default: m.UrlTool })));
const UrlParserTool = lazy(() => import("./url-parser/UrlParserTool").then((m) => ({ default: m.UrlParserTool })));
const SlugTool = lazy(() => import("./slug/SlugTool").then((m) => ({ default: m.SlugTool })));
const HtmlEntitiesTool = lazy(() =>
  import("./html-entities/HtmlEntitiesTool").then((m) => ({ default: m.HtmlEntitiesTool })),
);
const BasicAuthTool = lazy(() => import("./basic-auth/BasicAuthTool").then((m) => ({ default: m.BasicAuthTool })));
const JsonTool = lazy(() => import("./json/JsonTool").then((m) => ({ default: m.JsonTool })));
const RegexTool = lazy(() => import("./regex/RegexTool").then((m) => ({ default: m.RegexTool })));
const ChmodTool = lazy(() => import("./chmod/ChmodTool").then((m) => ({ default: m.ChmodTool })));
const CaseTool = lazy(() => import("./case/CaseTool").then((m) => ({ default: m.CaseTool })));
const ColorTool = lazy(() => import("./color/ColorTool").then((m) => ({ default: m.ColorTool })));
const BaseConverterTool = lazy(() =>
  import("./base-converter/BaseConverterTool").then((m) => ({ default: m.BaseConverterTool })),
);
const RomanTool = lazy(() => import("./roman/RomanTool").then((m) => ({ default: m.RomanTool })));
const TimestampTool = lazy(() => import("./timestamp/TimestampTool").then((m) => ({ default: m.TimestampTool })));
const DiffTool = lazy(() => import("./diff/DiffTool").then((m) => ({ default: m.DiffTool })));
const TextStatsTool = lazy(() => import("./text-stats/TextStatsTool").then((m) => ({ default: m.TextStatsTool })));
const LoremTool = lazy(() => import("./lorem/LoremTool").then((m) => ({ default: m.LoremTool })));
const SubnetTool = lazy(() => import("./subnet/SubnetTool").then((m) => ({ default: m.SubnetTool })));
const IbanTool = lazy(() => import("./iban/IbanTool").then((m) => ({ default: m.IbanTool })));
const JsonDiffTool = lazy(() => import("./json-diff/JsonDiffTool").then((m) => ({ default: m.JsonDiffTool })));
const PercentageTool = lazy(() => import("./percentage/PercentageTool").then((m) => ({ default: m.PercentageTool })));
const MathEvalTool = lazy(() => import("./math-eval/MathEvalTool").then((m) => ({ default: m.MathEvalTool })));
const ListConverterTool = lazy(() =>
  import("./list-converter/ListConverterTool").then((m) => ({ default: m.ListConverterTool })),
);
const NatoTool = lazy(() => import("./nato/NatoTool").then((m) => ({ default: m.NatoTool })));
const UnicodeTool = lazy(() => import("./unicode/UnicodeTool").then((m) => ({ default: m.UnicodeTool })));
const ObfuscatorTool = lazy(() => import("./obfuscator/ObfuscatorTool").then((m) => ({ default: m.ObfuscatorTool })));
const NumeronymTool = lazy(() => import("./numeronym/NumeronymTool").then((m) => ({ default: m.NumeronymTool })));
const EmailNormalizerTool = lazy(() =>
  import("./email-normalizer/EmailNormalizerTool").then((m) => ({ default: m.EmailNormalizerTool })),
);
const TemperatureTool = lazy(() =>
  import("./temperature/TemperatureTool").then((m) => ({ default: m.TemperatureTool })),
);
const Ipv4ConverterTool = lazy(() =>
  import("./ipv4-converter/Ipv4ConverterTool").then((m) => ({ default: m.Ipv4ConverterTool })),
);
const Ipv4RangeTool = lazy(() => import("./ipv4-range/Ipv4RangeTool").then((m) => ({ default: m.Ipv4RangeTool })));
const Ipv6UlaTool = lazy(() => import("./ipv6-ula/Ipv6UlaTool").then((m) => ({ default: m.Ipv6UlaTool })));
const MacAddressTool = lazy(() => import("./mac-address/MacAddressTool").then((m) => ({ default: m.MacAddressTool })));
const RandomPortTool = lazy(() => import("./random-port/RandomPortTool").then((m) => ({ default: m.RandomPortTool })));
const DeviceInfoTool = lazy(() => import("./device-info/DeviceInfoTool").then((m) => ({ default: m.DeviceInfoTool })));
const YamlTool = lazy(() => import("./yaml/YamlTool").then((m) => ({ default: m.YamlTool })));
const TomlTool = lazy(() => import("./toml/TomlTool").then((m) => ({ default: m.TomlTool })));
const SqlFormatterTool = lazy(() =>
  import("./sql-formatter/SqlFormatterTool").then((m) => ({ default: m.SqlFormatterTool })),
);
const BcryptTool = lazy(() => import("./bcrypt/BcryptTool").then((m) => ({ default: m.BcryptTool })));
const Bip39Tool = lazy(() => import("./bip39/Bip39Tool").then((m) => ({ default: m.Bip39Tool })));
const QrCodeTool = lazy(() => import("./qrcode/QrCodeTool").then((m) => ({ default: m.QrCodeTool })));
const WifiQrCodeTool = lazy(() => import("./wifi-qrcode/WifiQrCodeTool").then((m) => ({ default: m.WifiQrCodeTool })));
const RsaKeypairTool = lazy(() => import("./rsa-keypair/RsaKeypairTool").then((m) => ({ default: m.RsaKeypairTool })));
const AesTool = lazy(() => import("./aes/AesTool").then((m) => ({ default: m.AesTool })));
const PasswordStrengthTool = lazy(() =>
  import("./password-strength/PasswordStrengthTool").then((m) => ({ default: m.PasswordStrengthTool })),
);
const PasswordGeneratorTool = lazy(() =>
  import("./password-generator/PasswordGeneratorTool").then((m) => ({ default: m.PasswordGeneratorTool })),
);
const AiChatTool = lazy(() => import("./ai-chat/AiChatTool").then((m) => ({ default: m.AiChatTool })));
const CronTool = lazy(() => import("./cron/CronTool").then((m) => ({ default: m.CronTool })));
const MarkdownTool = lazy(() => import("./markdown/MarkdownTool").then((m) => ({ default: m.MarkdownTool })));
const XmlFormatterTool = lazy(() =>
  import("./xml-formatter/XmlFormatterTool").then((m) => ({ default: m.XmlFormatterTool })),
);
const SvgPlaceholderTool = lazy(() =>
  import("./svg-placeholder/SvgPlaceholderTool").then((m) => ({ default: m.SvgPlaceholderTool })),
);
const ColorBlindnessTool = lazy(() =>
  import("./color-blindness/ColorBlindnessTool").then((m) => ({ default: m.ColorBlindnessTool })),
);
const UserAgentTool = lazy(() => import("./user-agent/UserAgentTool").then((m) => ({ default: m.UserAgentTool })));
const DockerComposeTool = lazy(() =>
  import("./docker-compose/DockerComposeTool").then((m) => ({ default: m.DockerComposeTool })),
);
const HttpStatusTool = lazy(() => import("./http-status/HttpStatusTool").then((m) => ({ default: m.HttpStatusTool })));
const MimeTypesTool = lazy(() => import("./mime-types/MimeTypesTool").then((m) => ({ default: m.MimeTypesTool })));
const RegexCheatsheetTool = lazy(() =>
  import("./regex-cheatsheet/RegexCheatsheetTool").then((m) => ({ default: m.RegexCheatsheetTool })),
);
const GitCheatsheetTool = lazy(() =>
  import("./git-cheatsheet/GitCheatsheetTool").then((m) => ({ default: m.GitCheatsheetTool })),
);
const MetaTagsTool = lazy(() => import("./meta-tags/MetaTagsTool").then((m) => ({ default: m.MetaTagsTool })));
const EmojiPickerTool = lazy(() => import("./emoji-picker/EmojiPickerTool").then((m) => ({ default: m.EmojiPickerTool })));
const CsrTool = lazy(() => import("./csr/CsrTool").then((m) => ({ default: m.CsrTool })));
const SelfSignedCertTool = lazy(() =>
  import("./self-signed-cert/SelfSignedCertTool").then((m) => ({ default: m.SelfSignedCertTool })),
);
const CertReaderTool = lazy(() => import("./cert-reader/CertReaderTool").then((m) => ({ default: m.CertReaderTool })));
const PfxTool = lazy(() => import("./pfx/PfxTool").then((m) => ({ default: m.PfxTool })));
const PemDerTool = lazy(() => import("./pem-der/PemDerTool").then((m) => ({ default: m.PemDerTool })));

export const TOOLS: ToolDefinition[] = [
  // Crypto
  {
    id: "base64",
    name: "Encodeur / Décodeur Base64",
    category: "Crypto",
    description: "Convertit du texte vers et depuis le Base64.",
    status: "ready",
    Component: Base64Tool,
  },
  {
    id: "hash",
    name: "Générateur de hash",
    category: "Crypto",
    description: "Empreintes SHA-1/256/384/512, calculées en local.",
    status: "ready",
    Component: HashTool,
  },
  {
    id: "uuid",
    name: "Générateur d'UUID",
    category: "Crypto",
    description: "Crée des UUID v4 à la demande.",
    status: "ready",
    Component: UuidTool,
  },
  {
    id: "ulid",
    name: "Générateur d'ULID",
    category: "Crypto",
    description: "Identifiants triables par le temps, encodés en Crockford base32.",
    status: "ready",
    Component: UlidTool,
  },
  {
    id: "token",
    name: "Générateur de jeton",
    category: "Crypto",
    description: "Chaînes aléatoires cryptographiquement sûres, longueur et alphabet configurables.",
    status: "ready",
    Component: TokenTool,
  },
  {
    id: "hmac",
    name: "Générateur HMAC",
    category: "Crypto",
    description: "Signe un message avec une clé secrète (SHA-1/256/384/512).",
    status: "ready",
    Component: HmacTool,
  },
  {
    id: "jwt",
    name: "Décodeur JWT",
    category: "Crypto",
    description: "Inspecte l'en-tête et les claims du payload.",
    status: "ready",
    Component: JwtTool,
  },
  {
    id: "bcrypt",
    name: "Bcrypt",
    category: "Crypto",
    description: "Hache un mot de passe ou vérifie une correspondance.",
    status: "ready",
    Component: BcryptTool,
  },
  {
    id: "bip39",
    name: "Passphrase BIP-39",
    category: "Crypto",
    description: "Génère une passphrase mnémonique et son seed dérivé.",
    status: "ready",
    Component: Bip39Tool,
  },
  {
    id: "rsa-keypair",
    name: "Paire de clés RSA",
    category: "Crypto",
    description: "Génère une paire de clés RSA-OAEP ou RSASSA-PKCS1, au format PEM.",
    status: "ready",
    Component: RsaKeypairTool,
  },
  {
    id: "aes",
    name: "Chiffrement AES",
    category: "Crypto",
    description: "Chiffre et déchiffre un texte avec AES-256-GCM et une phrase secrète.",
    status: "ready",
    Component: AesTool,
  },
  {
    id: "password-strength",
    name: "Analyseur de mot de passe",
    category: "Crypto",
    description: "Estime l'entropie et détecte les motifs faibles d'un mot de passe.",
    status: "ready",
    Component: PasswordStrengthTool,
  },
  {
    id: "password-generator",
    name: "Générateur de mot de passe",
    category: "Crypto",
    description: "Longueur, jeux de caractères et exclusion des caractères ambigus, avec indicateur de force.",
    status: "ready",
    Component: PasswordGeneratorTool,
  },

  // Web
  {
    id: "url",
    name: "Encodeur / Décodeur URL",
    category: "Web",
    description: "Encode des chaînes pour les URL.",
    status: "ready",
    Component: UrlTool,
  },
  {
    id: "url-parser",
    name: "Analyseur d'URL",
    category: "Web",
    description: "Décompose une URL en ses parties et ses paramètres de requête.",
    status: "ready",
    Component: UrlParserTool,
  },
  {
    id: "slug",
    name: "Générateur de slug",
    category: "Web",
    description: "Transforme un titre en identifiant d'URL propre.",
    status: "ready",
    Component: SlugTool,
  },
  {
    id: "html-entities",
    name: "Entités HTML",
    category: "Web",
    description: "Encode et décode les entités HTML courantes.",
    status: "ready",
    Component: HtmlEntitiesTool,
  },
  {
    id: "basic-auth",
    name: "Générateur Basic Auth",
    category: "Web",
    description: "Construit l'en-tête Authorization à partir d'un identifiant et d'un mot de passe.",
    status: "ready",
    Component: BasicAuthTool,
  },

  // Development
  {
    id: "json",
    name: "Formateur JSON",
    category: "Development",
    description: "Met en forme, minifie et valide du JSON.",
    status: "ready",
    Component: JsonTool,
  },
  {
    id: "regex",
    name: "Testeur de regex",
    category: "Development",
    description: "Teste un motif sur un texte d'exemple, avec surlignage des correspondances.",
    status: "ready",
    Component: RegexTool,
  },
  {
    id: "chmod",
    name: "Calculateur chmod",
    category: "Development",
    description: "Convertit des permissions Unix entre notation octale et symbolique.",
    status: "ready",
    Component: ChmodTool,
  },
  {
    id: "json-diff",
    name: "Comparateur JSON",
    category: "Development",
    description: "Compare deux documents JSON structurellement.",
    status: "ready",
    Component: JsonDiffTool,
  },
  {
    id: "cron",
    name: "Analyseur de cron",
    category: "Development",
    description: "Explique une expression cron en langage clair.",
    status: "ready",
    Component: CronTool,
  },
  {
    id: "sql-formatter",
    name: "Formateur SQL",
    category: "Development",
    description: "Met en forme une requête SQL (standard, MySQL, PostgreSQL).",
    status: "ready",
    Component: SqlFormatterTool,
  },
  {
    id: "xml-formatter",
    name: "Formateur XML",
    category: "Development",
    description: "Indente un document XML.",
    status: "ready",
    Component: XmlFormatterTool,
  },
  {
    id: "docker-compose",
    name: "docker run → compose",
    category: "Development",
    description: "Convertit une commande docker run en service docker-compose.",
    status: "ready",
    Component: DockerComposeTool,
  },
  {
    id: "regex-cheatsheet",
    name: "Aide-mémoire Regex",
    category: "Development",
    description: "Référence rapide de la syntaxe des expressions régulières.",
    status: "ready",
    Component: RegexCheatsheetTool,
  },
  {
    id: "git-cheatsheet",
    name: "Aide-mémoire Git",
    category: "Development",
    description: "Commandes Git courantes, avec description et copie rapide.",
    status: "ready",
    Component: GitCheatsheetTool,
  },

  // Converter
  {
    id: "yaml",
    name: "Convertisseur JSON ↔ YAML",
    category: "Converter",
    description: "Convertit entre JSON et YAML dans les deux sens.",
    status: "ready",
    Component: YamlTool,
  },
  {
    id: "toml",
    name: "Convertisseur JSON ↔ TOML",
    category: "Converter",
    description: "Convertit entre JSON et TOML dans les deux sens.",
    status: "ready",
    Component: TomlTool,
  },
  {
    id: "case",
    name: "Convertisseur de casse",
    category: "Converter",
    description: "camelCase, snake_case, kebab-case, Title Case et plus, en un coup d'œil.",
    status: "ready",
    Component: CaseTool,
  },
  {
    id: "color",
    name: "Convertisseur de couleurs",
    category: "Converter",
    description: "HEX, RGB, HSL en un coup d'œil.",
    status: "ready",
    Component: ColorTool,
  },
  {
    id: "base-converter",
    name: "Convertisseur de base numérique",
    category: "Converter",
    description: "Binaire, octal, décimal, hexadécimal.",
    status: "ready",
    Component: BaseConverterTool,
  },
  {
    id: "roman",
    name: "Chiffres romains",
    category: "Converter",
    description: "Convertit entre nombres arabes et chiffres romains.",
    status: "ready",
    Component: RomanTool,
  },
  {
    id: "timestamp",
    name: "Convertisseur de timestamp",
    category: "Converter",
    description: "Temps Unix vers et depuis une date calendaire.",
    status: "ready",
    Component: TimestampTool,
  },
  {
    id: "list-converter",
    name: "Convertisseur de liste",
    category: "Converter",
    description: "Nettoie, trie, déduplique et reformate une liste.",
    status: "ready",
    Component: ListConverterTool,
  },
  {
    id: "unicode",
    name: "Convertisseur Unicode",
    category: "Converter",
    description: "Texte vers points de code Unicode, et inversement.",
    status: "ready",
    Component: UnicodeTool,
  },
  {
    id: "temperature",
    name: "Convertisseur de température",
    category: "Converter",
    description: "Celsius, Fahrenheit et Kelvin.",
    status: "ready",
    Component: TemperatureTool,
  },

  // Math
  {
    id: "percentage",
    name: "Calculateur de pourcentage",
    category: "Math",
    description: "Pourcentage d'une valeur, proportion et variation entre deux nombres.",
    status: "ready",
    Component: PercentageTool,
  },
  {
    id: "math-eval",
    name: "Évaluateur d'expression",
    category: "Math",
    description: "Calcule une expression mathématique sans jamais utiliser eval().",
    status: "ready",
    Component: MathEvalTool,
  },

  // Text
  {
    id: "diff",
    name: "Comparateur de texte",
    category: "Text",
    description: "Compare deux blocs de texte ligne à ligne.",
    status: "ready",
    Component: DiffTool,
  },
  {
    id: "text-stats",
    name: "Statistiques de texte",
    category: "Text",
    description: "Mots, caractères, lignes et temps de lecture estimé.",
    status: "ready",
    Component: TextStatsTool,
  },
  {
    id: "lorem",
    name: "Générateur Lorem Ipsum",
    category: "Text",
    description: "Mots, phrases ou paragraphes de texte de remplissage.",
    status: "ready",
    Component: LoremTool,
  },
  {
    id: "nato",
    name: "Alphabet OTAN",
    category: "Text",
    description: "Épelle un texte avec l'alphabet phonétique OTAN.",
    status: "ready",
    Component: NatoTool,
  },
  {
    id: "obfuscator",
    name: "Masqueur de texte",
    category: "Text",
    description: "Masque une partie d'une chaîne sensible (carte, email…).",
    status: "ready",
    Component: ObfuscatorTool,
  },
  {
    id: "numeronym",
    name: "Générateur de numéronyme",
    category: "Text",
    description: "Contracte les mots longs, comme i18n ou a11y.",
    status: "ready",
    Component: NumeronymTool,
  },
  {
    id: "markdown",
    name: "Éditeur Markdown",
    category: "Text",
    description: "Créez, éditez et prévisualisez des documents Markdown, sauvegardés en local.",
    status: "ready",
    Component: MarkdownTool,
  },
  {
    id: "emoji-picker",
    name: "Sélecteur d'émojis",
    category: "Text",
    description: "Recherche et copie un émoji courant.",
    status: "ready",
    Component: EmojiPickerTool,
  },

  // Network
  {
    id: "subnet",
    name: "Calculateur de sous-réseau",
    category: "Network",
    description: "Adresse réseau, diffusion et plage d'hôtes à partir d'une notation CIDR.",
    status: "ready",
    Component: SubnetTool,
  },
  {
    id: "ipv4-converter",
    name: "Convertisseur d'adresse IPv4",
    category: "Network",
    description: "Décimal pointé, entier, hexadécimal et binaire.",
    status: "ready",
    Component: Ipv4ConverterTool,
  },
  {
    id: "ipv4-range",
    name: "Expanseur de plage IPv4",
    category: "Network",
    description: "Liste toutes les adresses d'un bloc CIDR.",
    status: "ready",
    Component: Ipv4RangeTool,
  },
  {
    id: "ipv6-ula",
    name: "Générateur IPv6 ULA",
    category: "Network",
    description: "Préfixe local unique aléatoire selon la RFC 4193.",
    status: "ready",
    Component: Ipv6UlaTool,
  },
  {
    id: "mac-address",
    name: "Générateur d'adresse MAC",
    category: "Network",
    description: "Adresse MAC aléatoire, administrée localement ou non.",
    status: "ready",
    Component: MacAddressTool,
  },
  {
    id: "random-port",
    name: "Générateur de port aléatoire",
    category: "Network",
    description: "Port aléatoire dans la plage enregistrée ou dynamique.",
    status: "ready",
    Component: RandomPortTool,
  },

  // Web
  {
    id: "email-normalizer",
    name: "Normalisateur d'email",
    category: "Web",
    description: "Normalise la casse et retire les alias (+tag, points Gmail).",
    status: "ready",
    Component: EmailNormalizerTool,
  },
  {
    id: "device-info",
    name: "Informations sur l'appareil",
    category: "Web",
    description: "Détails du navigateur et de l'écran, lus en local.",
    status: "ready",
    Component: DeviceInfoTool,
  },
  {
    id: "user-agent",
    name: "Analyseur de User-Agent",
    category: "Web",
    description: "Décompose une chaîne User-Agent en navigateur, moteur, OS et appareil.",
    status: "ready",
    Component: UserAgentTool,
  },
  {
    id: "http-status",
    name: "Codes de statut HTTP",
    category: "Web",
    description: "Référence recherchable des codes de statut HTTP.",
    status: "ready",
    Component: HttpStatusTool,
  },
  {
    id: "mime-types",
    name: "Types MIME",
    category: "Web",
    description: "Référence recherchable des types MIME par extension.",
    status: "ready",
    Component: MimeTypesTool,
  },
  {
    id: "meta-tags",
    name: "Générateur de balises meta",
    category: "Web",
    description: "Génère les balises Open Graph et Twitter Card pour le <head>.",
    status: "ready",
    Component: MetaTagsTool,
  },

  // Images et vidéos
  {
    id: "qrcode",
    name: "Générateur de QR Code",
    category: "Images",
    description: "Génère un QR code à partir d'un texte ou d'une URL.",
    status: "ready",
    Component: QrCodeTool,
  },
  {
    id: "wifi-qrcode",
    name: "QR Code Wi-Fi",
    category: "Images",
    description: "QR code de connexion Wi-Fi automatique.",
    status: "ready",
    Component: WifiQrCodeTool,
  },
  {
    id: "svg-placeholder",
    name: "Placeholder SVG",
    category: "Images",
    description: "Génère une image de substitution SVG aux dimensions voulues.",
    status: "ready",
    Component: SvgPlaceholderTool,
  },
  {
    id: "color-blindness",
    name: "Simulateur de daltonisme",
    category: "Images",
    description: "Prévisualise une couleur selon différents types de daltonisme.",
    status: "ready",
    Component: ColorBlindnessTool,
  },

  // Certificats
  {
    id: "csr",
    name: "Générateur de CSR",
    category: "Certificats",
    description: "Génère une clé privée et une demande de signature de certificat (PKCS#10).",
    status: "ready",
    Component: CsrTool,
  },
  {
    id: "self-signed-cert",
    name: "Certificat auto-signé",
    category: "Certificats",
    description: "Génère une clé privée et un certificat X.509 auto-signé.",
    status: "ready",
    Component: SelfSignedCertTool,
  },
  {
    id: "cert-reader",
    name: "Lecteur de certificat",
    category: "Certificats",
    description: "Décode un certificat PEM : sujet, émetteur, validité, SAN, empreintes.",
    status: "ready",
    Component: CertReaderTool,
  },
  {
    id: "pfx",
    name: "Empaqueteur PFX / PKCS#12",
    category: "Certificats",
    description: "Combine un certificat et une clé en .pfx, ou extrait un .pfx existant.",
    status: "ready",
    Component: PfxTool,
  },
  {
    id: "pem-der",
    name: "Convertisseur PEM ↔ DER",
    category: "Certificats",
    description: "Convertit un bloc PEM en DER (hex/base64) et inversement.",
    status: "ready",
    Component: PemDerTool,
  },

  // IA
  {
    id: "ai-chat",
    name: "Chat IA",
    category: "IA",
    description: "Discute en streaming avec l'API de chat de votre choix — URL et en-têtes configurables.",
    status: "ready",
    Component: AiChatTool,
    statusLabel: "Envoie vos messages à l'URL configurée — seul outil réseau de Toolbox",
    statusTone: "neutral",
  },

  // Data
  {
    id: "iban",
    name: "Validateur IBAN",
    category: "Data",
    description: "Vérifie la clé de contrôle d'un IBAN et le formate.",
    status: "ready",
    Component: IbanTool,
  },
];

export const CATEGORIES = Array.from(new Set(TOOLS.map((t) => t.category)));
