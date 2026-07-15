/**
 * Root `/` is only a locale hop. Prefer browser language; default PT-BR for Brazil-first demo.
 * Inline script runs before paint so users never sit on this page; hard navigation hits
 * CloudFront's directory→index.html rewrite for `/pt/` and `/en/`.
 */
export default function Root() {
  const redirectScript = `
(function () {
  try {
    var langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || "pt"];
    var locale = "pt";
    for (var i = 0; i < langs.length; i++) {
      var code = String(langs[i] || "").toLowerCase();
      if (code.indexOf("pt") === 0) { locale = "pt"; break; }
      if (code.indexOf("en") === 0) { locale = "en"; break; }
    }
    location.replace("/" + locale + "/");
  } catch (e) {
    location.replace("/pt/");
  }
})();
`.trim();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-base px-4 text-center">
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
      <p className="font-display text-2xl font-bold text-primary">LeveCare</p>
      <p className="text-sm text-on-surface-variant">Redirecionando… / Redirecting…</p>
      <div className="flex gap-4 text-sm">
        <a className="font-semibold text-primary-action underline" href="/pt/">
          Continuar em português
        </a>
        <a className="font-semibold text-primary-action underline" href="/en/">
          Continue in English
        </a>
      </div>
    </main>
  );
}
