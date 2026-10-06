// Write-ups are stored as plain text, often pasted with hard line breaks at a
// fixed width. This reflows them: blank lines separate paragraphs, single
// newlines inside a paragraph become spaces, and lines starting with "- " become
// a real list. A short run-in lead ("Valuation.", "Capital allocation.") is set
// in bold, like a magazine run-in head.

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    let para: string[] = [];
    let list: string[] = [];
    const flushPara = () => {
      if (para.length) blocks.push({ type: "p", text: para.join(" ").trim() });
      para = [];
    };
    const flushList = () => {
      if (list.length) blocks.push({ type: "ul", items: list });
      list = [];
    };
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      if (/^[-•]\s+/.test(t)) {
        flushPara();
        list.push(t.replace(/^[-•]\s+/, ""));
      } else if (list.length) {
        const last = list[list.length - 1];
        if (/[.!?:]$/.test(last) && /^[A-Z]/.test(t)) {
          // a finished item followed by a new sentence: that's a paragraph, not a wrapped line
          flushList();
          para.push(t);
        } else {
          list[list.length - 1] = last + " " + t;
        }
      } else {
        para.push(t);
      }
    }
    flushPara();
    flushList();
  }
  return blocks;
}

function Para({ text }: { text: string }) {
  const m = text.match(/^([A-Z][A-Za-z'’-]*(?: [A-Za-z'’-]+)?)\.\s+(.*)$/s);
  if (m && m[1].split(" ").length <= 2 && m[1].length >= 6) {
    return (
      <p>
        <strong className="font-semibold">{m[1]}.</strong> {m[2]}
      </p>
    );
  }
  return <p>{text}</p>;
}

export function Prose({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`prose-research space-y-5 ${className}`}>
      {parseBlocks(text).map((b, i) =>
        b.type === "p" ? (
          <Para key={i} text={b.text} />
        ) : (
          <ul key={i} className="list-disc space-y-2 pl-6 marker:text-forest">
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
