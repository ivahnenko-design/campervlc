/**
 * Minimal Markdown reader for the rental-conditions texts in /content.
 *
 * It understands exactly what those files use: # ## ### headings, paragraphs,
 * "- " lists, pipe tables, "> " notes and a "---" rule. Nothing else is
 * interpreted, and text is never treated as HTML, so a stray "<" in a clause
 * can not turn into markup.
 */

export type MdBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string; id: string | null }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "quote"; text: string }
  | { type: "rule" };

/** Anchor ids stay identical in every language (the files share one structure). */
const H2_IDS = ["incluye-el-precio", "vehiculo-y-recogida", "tarifas-y-suplementos", "condiciones-generales"];
/** "### 4. Cancelación…" is linked from the cancellation page, the footer and emails. */
const CANCELLATION_SECTION = 4;

export function clauseId(sectionNumber: number): string {
  return sectionNumber === CANCELLATION_SECTION ? "cancelacion" : `clausula-${sectionNumber}`;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

const isTableSeparator = (line: string) => /^\|[\s:|-]+\|$/.test(line.trim()) && line.includes("-");

export function parseMarkdown(source: string): MdBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let h2Index = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      blocks.push({ type: "rule" });
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,3}) (.*)$/);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3;
      const text = heading[2].trim();
      let id: string | null = null;
      if (level === 2) id = H2_IDS[h2Index++] ?? `seccion-${h2Index}`;
      if (level === 3) {
        const n = text.match(/^(\d+)\./);
        if (n) id = clauseId(Number(n[1]));
      }
      blocks.push({ type: "heading", level, text, id });
      i++;
      continue;
    }

    if (line.startsWith("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const head = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", head, rows });
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    if (line.startsWith("> ")) {
      const parts: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        parts.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push({ type: "quote", text: parts.join(" ") });
      continue;
    }

    // Paragraph: runs until a blank line or the start of another block type.
    const parts: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3} |---+\s*$|- |> |\|)/.test(lines[i])
    ) {
      parts.push(lines[i].trim());
      i++;
    }
    if (parts.length) blocks.push({ type: "paragraph", text: parts.join(" ") });
    else i++; // never loop on an unexpected line
  }

  return blocks;
}

export interface TocEntry {
  level: 2 | 3;
  text: string;
  id: string;
}

export function tableOfContents(blocks: MdBlock[]): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const b of blocks) {
    if (b.type === "heading" && b.id && (b.level === 2 || b.level === 3)) {
      entries.push({ level: b.level, text: b.text, id: b.id });
    }
  }
  return entries;
}
