// Build-time TypeScript highlighter for landing-page snippets, so code renders
// without loading Shiki at runtime. Pair with the .hl-* classes in global.css.
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TOKEN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*')|\b(import|from|export|const|await|async|as|satisfies)\b|\b(\d+)\b|([A-Za-z_$][\w$]*)(?=\s*:(?!:))|([A-Za-z_$][\w$]*)(?=\s*\()|([\s\S])/g;

export const highlight = (code: string): string =>
  code.replace(TOKEN, (match, comment, str, keyword, num, prop, fn) => {
    if (comment) return `<span class="hl-com">${escapeHtml(comment)}</span>`;
    if (str) return `<span class="hl-str">${escapeHtml(str)}</span>`;
    if (keyword) return `<span class="hl-kw">${keyword}</span>`;
    if (num) return `<span class="hl-num">${num}</span>`;
    if (prop) return `<span class="hl-prop">${prop}</span>`;
    if (fn) return `<span class="hl-fn">${fn}</span>`;
    return escapeHtml(match);
  });
