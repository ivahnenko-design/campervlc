import { Fragment, useMemo, type ReactNode } from "react";
import { Info } from "lucide-react";
import { parseMarkdown, tableOfContents, type MdBlock, type TocEntry } from "@/lib/markdown";

// "4.1. Cancelación …" — the clause number leads the paragraph.
const CLAUSE_LABEL = /^(\d+\.\d+\.)\s+(.*)$/s;

function Paragraph({ text }: { text: string }) {
  const match = text.match(CLAUSE_LABEL);
  return (
    <p className="text-[15px] leading-relaxed text-foreground/90">
      {match ? (
        <>
          <span className="mr-2 font-mono-num font-semibold text-primary">{match[1]}</span>
          {match[2]}
        </>
      ) : (
        text
      )}
    </p>
  );
}

function renderBlock(block: MdBlock, key: number): ReactNode {
  switch (block.type) {
    case "heading": {
      if (block.level === 1) {
        return (
          <h1 key={key} className="font-display text-3xl sm:text-4xl text-foreground">
            {block.text}
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2
            key={key}
            id={block.id ?? undefined}
            className="scroll-mt-24 border-t border-border/50 pt-10 font-display text-2xl text-foreground"
          >
            {block.text}
          </h2>
        );
      }
      return (
        <h3 key={key} id={block.id ?? undefined} className="scroll-mt-24 pt-4 font-display text-lg text-primary">
          {block.text}
        </h3>
      );
    }
    case "paragraph":
      return <Paragraph key={key} text={block.text} />;
    case "list":
      return (
        <ul key={key} className="space-y-1.5 pl-5 text-[15px] leading-relaxed text-foreground/90 marker:text-primary/70 list-disc">
          {block.items.map((item, n) => (
            <li key={n}>{item}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div key={key} className="overflow-x-auto rounded-xl border border-border/60 bg-surface">
          <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-background/40">
                {block.head.map((cell, n) => (
                  <th key={n} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-border/30 last:border-0">
                  {row.map((cell, n) => (
                    <td key={n} className={`px-4 py-2.5 align-top ${n === row.length - 1 ? "font-mono-num whitespace-nowrap text-foreground" : "text-foreground/90"}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "quote":
      return (
        <p
          key={key}
          className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{block.text}</span>
        </p>
      );
    case "rule":
      return <hr key={key} className="border-border/50" />;
  }
}

export function ConditionsToc({ entries, title }: { entries: TocEntry[]; title: string }) {
  return (
    <nav aria-label={title} className="rounded-xl border border-border/60 bg-surface p-5">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <ul className="columns-1 gap-8 sm:columns-2 text-sm">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.level === 2 ? "mt-3 break-inside-avoid font-medium text-foreground first:mt-0" : "break-inside-avoid py-0.5 text-muted-foreground"}>
            <a href={`#${entry.id}`} className="hover:text-primary transition-colors">
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ConditionsDocument({ markdown, tocTitle }: { markdown: string; tocTitle: string }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);
  const toc = useMemo(() => tableOfContents(blocks), [blocks]);

  // Everything before the first "##" is the title and intro; the contents list
  // goes right after it.
  const firstSection = blocks.findIndex((b) => b.type === "heading" && b.level === 2);
  const intro = firstSection === -1 ? blocks : blocks.slice(0, firstSection);
  const rest = firstSection === -1 ? [] : blocks.slice(firstSection);

  return (
    <article className="space-y-5">
      {intro.map((b, i) => (
        <Fragment key={i}>{renderBlock(b, i)}</Fragment>
      ))}
      <ConditionsToc entries={toc} title={tocTitle} />
      {rest.map((b, i) => (
        <Fragment key={i}>{renderBlock(b, i + intro.length)}</Fragment>
      ))}
    </article>
  );
}
