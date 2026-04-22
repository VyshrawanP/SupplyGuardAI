function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeHref(rawHref: string) {
  const href = rawHref.trim();
  if (!href) return null;
  if (href.startsWith('#')) return href;
  if (href.startsWith('mailto:')) return href;
  if (href.startsWith('https://') || href.startsWith('http://')) return href;
  return null;
}

export function slugifyHeading(input: string) {
  const slug = input
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-');
  return slug || 'section';
}

function uniqueId(base: string, seen: Map<string, number>) {
  const current = seen.get(base) ?? 0;
  if (current === 0) {
    seen.set(base, 1);
    return base;
  }
  const next = current + 1;
  seen.set(base, next);
  return `${base}-${next}`;
}

export type MarkdownHeading = {
  id: string;
  level: number;
  text: string;
};

export function extractMarkdownHeadings(markdown: string, levels: number[] = [2, 3]) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const seen = new Map<string, number>();
  const headings: MarkdownHeading[] = [];

  let inCodeFence = false;
  for (const rawLine of lines) {
    const line = rawLine ?? '';
    if (line.startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = /^(#{1,4})\s+(.*)$/.exec(line);
    if (!match) continue;
    const level = Math.min(4, match[1]?.length ?? 1);
    if (!levels.includes(level)) continue;
    const text = (match[2] ?? '').trim();
    const base = slugifyHeading(text);
    const id = uniqueId(base, seen);
    headings.push({ id, level, text });
  }

  return headings;
}

function inlineFormat(escapedText: string) {
  let text = escapedText;

  text = text.replaceAll(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replaceAll(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replaceAll(/\*([^*]+)\*/g, '<em>$1</em>');

  text = text.replaceAll(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => {
    const safe = safeHref(href);
    const escapedLabel = label;
    if (!safe) return escapedLabel;
    const escapedHref = escapeHtml(safe);
    const external = safe.startsWith('http');
    return `<a href="${escapedHref}" ${external ? 'target="_blank" rel="noreferrer"' : ''}>${escapedLabel}</a>`;
  });

  return text;
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const html: string[] = [];
  const seenHeadingIds = new Map<string, number>();

  let inCodeFence = false;
  let codeLang = '';
  let codeLines: string[] = [];

  let inUl = false;
  let inOl = false;
  let inQuote = false;
  let quoteLines: string[] = [];

  const flushList = () => {
    if (inUl) html.push('</ul>');
    if (inOl) html.push('</ol>');
    inUl = false;
    inOl = false;
  };

  const flushQuote = () => {
    if (!inQuote) return;
    const content = inlineFormat(escapeHtml(quoteLines.join('\n')).replaceAll('\n', '<br />'));
    html.push(`<blockquote>${content}</blockquote>`);
    inQuote = false;
    quoteLines = [];
  };

  const flushCode = () => {
    const escaped = escapeHtml(codeLines.join('\n'));
    const langClass = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : '';
    html.push(`<pre><code${langClass}>${escaped}\n</code></pre>`);
    codeLines = [];
    codeLang = '';
  };

  for (const rawLine of lines) {
    const line = rawLine ?? '';

    if (line.startsWith('```')) {
      if (inCodeFence) {
        flushCode();
        inCodeFence = false;
        continue;
      }
      flushQuote();
      flushList();
      inCodeFence = true;
      codeLang = line.slice(3).trim();
      continue;
    }

    if (inCodeFence) {
      codeLines.push(line);
      continue;
    }

    const quoteMatch = /^>\s?(.*)$/.exec(line);
    if (quoteMatch) {
      flushList();
      inQuote = true;
      quoteLines.push(quoteMatch[1] ?? '');
      continue;
    }
    flushQuote();

    const headingMatch = /^(#{1,4})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushList();
      const level = Math.min(4, headingMatch[1]?.length ?? 1);
      const headingText = headingMatch[2] ?? '';
      const escapedHeading = inlineFormat(escapeHtml(headingText));
      const id = uniqueId(slugifyHeading(headingText), seenHeadingIds);
      html.push(`<h${level} id="${escapeHtml(id)}">${escapedHeading}</h${level}>`);
      continue;
    }

    if (/^\s*---\s*$/.test(line) || /^\s*\*\*\*\s*$/.test(line)) {
      flushList();
      html.push('<hr />');
      continue;
    }

    const ulMatch = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (ulMatch) {
      if (inOl) {
        html.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul>');
        inUl = true;
      }
      const item = inlineFormat(escapeHtml(ulMatch[1] ?? ''));
      html.push(`<li>${item}</li>`);
      continue;
    }

    const olMatch = /^\s*(\d+)\.\s+(.*)$/.exec(line);
    if (olMatch) {
      if (inUl) {
        html.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        html.push('<ol>');
        inOl = true;
      }
      const item = inlineFormat(escapeHtml(olMatch[2] ?? ''));
      html.push(`<li>${item}</li>`);
      continue;
    }

    flushList();

    if (!line.trim()) {
      html.push('');
      continue;
    }

    const paragraph = inlineFormat(escapeHtml(line));
    html.push(`<p>${paragraph}</p>`);
  }

  flushQuote();
  flushList();
  if (inCodeFence) flushCode();

  return html.join('\n');
}
