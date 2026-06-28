/**
 * Heuristically extracts exported symbol names from a source file. Covers the
 * common JS/TS forms; Python `def`/`class` as a bonus. Not a real parser, but
 * good enough to show "what this file exports" in the UI.
 */
export function parseExports(content: string, ext: string): string[] {
  const names = new Set<string>();

  if (["py"].includes(ext)) {
    const re = /^(?:def|class)\s+([A-Za-z_]\w*)/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      if (!m[1].startsWith("_")) names.add(m[1]);
    }
    return Array.from(names);
  }

  // export function/const/class/let/var Name
  const named =
    /export\s+(?:async\s+)?(?:function|const|class|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  let m: RegExpExecArray | null;
  while ((m = named.exec(content)) !== null) names.add(m[1]);

  // export { a, b as c }
  const braced = /export\s*\{([^}]+)\}/g;
  while ((m = braced.exec(content)) !== null) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }

  // export default Name / function Name
  const def = /export\s+default\s+(?:function\s+([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*))/;
  const dm = def.exec(content);
  if (dm) {
    const name = dm[1] || dm[2];
    if (name && name !== "function") names.add(`${name} (default)`);
    else names.add("default");
  } else if (/export\s+default/.test(content)) {
    names.add("default");
  }

  return Array.from(names);
}
