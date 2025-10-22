import React, { useRef } from "react";

// Minimal textarea-based editor exported as a named component so other parts of the app
// (e.g. ProceedingsForm) can import { EnhancedTextEditor } when they expect a simple
// markdown-like editor. Keep this small and dependency-free so it won't introduce
// runtime differences from the previous implementation.
export function EnhancedTextEditor({
  content,
  onChange,
  placeholder,
  className,
}: {
  content: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [preview, setPreview] = React.useState(false);

  const wrapSelection = (before: string, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = content || '';
    const selected = val.slice(start, end) || '';
    const newVal = val.slice(0, start) + before + selected + after + val.slice(end);
    onChange(newVal);

    // place caret after the inserted text
    requestAnimationFrame(() => {
      const pos = start + before.length + (selected.length || 0) + after.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertAtCaret = (text: string) => wrapSelection(text, '');

  const toggleWrap = (marker: string) => {
    // toggle based on whether selection is already wrapped
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = content || '';
    const selected = val.slice(start, end) || '';
    if (selected.startsWith(marker) && selected.endsWith(marker)) {
      const unwrapped = selected.slice(marker.length, selected.length - marker.length);
      const newVal = val.slice(0, start) + unwrapped + val.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start, start + unwrapped.length);
      });
    } else {
      wrapSelection(marker, marker);
    }
  };

  const makeHeading = (level: number) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = content || '';
    // Apply heading to the start of the selected lines
    const before = val.slice(0, start);
    const selected = val.slice(start, end);
    const after = val.slice(end);
    const lines = selected.split('\n').map(l => `#`.repeat(level) + ' ' + l);
    const newVal = before + lines.join('\n') + after;
    onChange(newVal);
  };

  const insertList = (ordered = false) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = content || '';
    const selected = val.slice(start, end) || '';
    const lines = selected.split('\n').filter(Boolean);
    if (lines.length === 0) {
      // insert a single list item
      const item = ordered ? '1. Item' : '- Item';
      insertAtCaret(item);
      return;
    }
    const out = lines.map((ln, idx) => ordered ? `${idx + 1}. ${ln}` : `- ${ln}`);
    const newVal = val.slice(0, start) + out.join('\n') + val.slice(end);
    onChange(newVal);
  };

  const indentSelection = (tab = '  ') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = content || '';
    const selected = val.slice(start, end) || '';
    const out = selected.split('\n').map(l => tab + l).join('\n');
    const newVal = val.slice(0, start) + out + val.slice(end);
    onChange(newVal);
  };

  const outdentSelection = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = content || '';
    const selected = val.slice(start, end) || '';
    const out = selected.split('\n').map(l => l.replace(/^\s{1,4}/, '')).join('\n');
    const newVal = val.slice(0, start) + out + val.slice(end);
    onChange(newVal);
  };

  const insertHr = () => insertAtCaret('\n---\n');

  const insertLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;
    const text = window.prompt('Link text (optional)') || url;
    insertAtCaret(`[${text}](${url})`);
  };

  const insertImage = () => {
    const url = window.prompt('Enter image URL');
    if (!url) return;
    insertAtCaret(`![](${url})`);
  };

  const clearAll = () => onChange('');

  const simplePreview = (markdown: string) => {
    // Very small subset: bold **, italic *, underline __, line breaks, headings and lists
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.*?)__/g, '<u>$1</u>');
    html = html.replace(/^#{1,6}\s*(.*$)/gm, (m, p1) => `<h${m.match(/^#+/)![0].length}>${p1}</h${m.match(/^#+/)![0].length}>`);
    html = html.replace(/(^|\n)(\d+\.\s.*)(?=\n|$)/g, (m) => `<p>${m.trim()}</p>`);
    html = html.replace(/(^|\n)-\s(.*)(?=\n|$)/g, (m, p1, p2) => `<li>${p2}</li>`);
    html = html.replace(/\n/g, '<br/>');
    return html;
  };

  return (
    <div className={"w-full border rounded bg-white thin-scrollbar " + (className || '')}>
      <style>{`
        /* Thin scrollbar for WebKit browsers */
        .thin-scrollbar textarea::-webkit-scrollbar,
        .thin-scrollbar .prose::-webkit-scrollbar,
        .thin-scrollbar [contenteditable]::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .thin-scrollbar textarea::-webkit-scrollbar-thumb,
        .thin-scrollbar .prose::-webkit-scrollbar-thumb,
        .thin-scrollbar [contenteditable]::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.35);
          border-radius: 999px;
        }
        .thin-scrollbar textarea::-webkit-scrollbar-track,
        .thin-scrollbar .prose::-webkit-scrollbar-track,
        .thin-scrollbar [contenteditable]::-webkit-scrollbar-track {
          background: transparent;
        }
        /* Firefox */
        .thin-scrollbar textarea,
        .thin-scrollbar .prose,
        .thin-scrollbar [contenteditable] {
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.35) transparent;
        }
      `}</style>
  <div className="sticky top-0 z-10 bg-white p-2 flex flex-wrap gap-1 items-center border-b">
        <button type="button" onClick={() => toggleWrap('**')} className="px-2 py-1 border rounded text-sm">B</button>
        <button type="button" onClick={() => toggleWrap('*')} className="px-2 py-1 border rounded text-sm italic">I</button>
        <button type="button" onClick={() => toggleWrap('__')} className="px-2 py-1 border rounded text-sm underline">U</button>
        <button type="button" onClick={() => toggleWrap('~~')} className="px-2 py-1 border rounded text-sm">S</button>
        <div className="border-l h-6 mx-1" />
        <button type="button" onClick={() => makeHeading(1)} className="px-2 py-1 border rounded text-sm">H1</button>
        <button type="button" onClick={() => makeHeading(2)} className="px-2 py-1 border rounded text-sm">H2</button>
        <button type="button" onClick={() => makeHeading(3)} className="px-2 py-1 border rounded text-sm">H3</button>
        <div className="border-l h-6 mx-1" />
        <button type="button" onClick={() => insertList(false)} className="px-2 py-1 border rounded text-sm">• List</button>
        <button type="button" onClick={() => insertList(true)} className="px-2 py-1 border rounded text-sm">1. List</button>
        <button type="button" onClick={() => indentSelection()} className="px-2 py-1 border rounded text-sm">→</button>
        <button type="button" onClick={outdentSelection} className="px-2 py-1 border rounded text-sm">←</button>
        <div className="border-l h-6 mx-1" />
        <button type="button" onClick={insertLink} className="px-2 py-1 border rounded text-sm">🔗</button>
        <button type="button" onClick={insertImage} className="px-2 py-1 border rounded text-sm">🖼️</button>
        <button type="button" onClick={() => wrapSelection('`', '`')} className="px-2 py-1 border rounded text-sm">{`</>`}</button>
        <button type="button" onClick={insertHr} className="px-2 py-1 border rounded text-sm">—</button>
        <div className="border-l h-6 mx-1" />
        <button type="button" onClick={clearAll} className="px-2 py-1 border rounded text-sm text-red-600">Clear</button>
        <button type="button" onClick={() => setPreview(p => !p)} className="px-2 py-1 border rounded text-sm ml-2">{preview ? 'Edit' : 'Preview'}</button>
      </div>

      <div className="p-2">
        {!preview ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 border rounded-md resize-y"
            style={{ minHeight: 400, fontFamily: 'inherit', fontSize: '0.95rem' }}
          />
        ) : (
          <div className="prose p-3 border rounded min-h-[400px] bg-white text-sm" dangerouslySetInnerHTML={{ __html: simplePreview(content || '') }} />
        )}
      </div>
    </div>
  );
}

const RichTextEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const exec = (command: string, value?: string) => {
    // document.execCommand's third argument expects string|undefined; use a cast to satisfy TS
    // value may be undefined when not needed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document.execCommand(command, false, value as any);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt("Enter the URL:");
    if (url) exec("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) exec("insertImage", url);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-white border-b p-1 flex flex-wrap gap-1 text-sm">

        {/* Inline formatting */}
        <button onClick={() => exec("bold")} className="px-2 border rounded">B</button>
        <button onClick={() => exec("italic")} className="px-2 border rounded italic">I</button>
        <button onClick={() => exec("underline")} className="px-2 border rounded underline">U</button>
        <button onClick={() => exec("strikeThrough")} className="px-2 border rounded line-through">S</button>
        <button onClick={() => exec("removeFormat")} className="px-2 border rounded">Tx</button>

        <div className="border-l mx-1 h-6" />

        {/* Headings */}
        <button onClick={() => exec("formatBlock", "<h1>")} className="px-2 border rounded">H1</button>
        <button onClick={() => exec("formatBlock", "<h2>")} className="px-2 border rounded">H2</button>
        <button onClick={() => exec("formatBlock", "<p>")} className="px-2 border rounded">P</button>

        <div className="border-l mx-1 h-6" />

        {/* Alignment */}
        <button onClick={() => exec("justifyLeft")} className="px-2 border rounded">⯇</button>
        <button onClick={() => exec("justifyCenter")} className="px-2 border rounded">≡</button>
        <button onClick={() => exec("justifyRight")} className="px-2 border rounded">⯈</button>
        <button onClick={() => exec("justifyFull")} className="px-2 border rounded">⯌</button>

        <div className="border-l mx-1 h-6" />

        {/* Lists */}
        <button onClick={() => exec("insertUnorderedList")} className="px-2 border rounded">• List</button>
        <button onClick={() => exec("insertOrderedList")} className="px-2 border rounded">1. List</button>

        <div className="border-l mx-1 h-6" />

        {/* Indent / Outdent */}
        <button onClick={() => exec("indent")} className="px-2 border rounded">→</button>
        <button onClick={() => exec("outdent")} className="px-2 border rounded">←</button>

        <div className="border-l mx-1 h-6" />

        {/* Links & Images */}
        <button onClick={insertLink} className="px-2 border rounded">🔗</button>
        <button onClick={insertImage} className="px-2 border rounded">🖼️</button>

        <div className="border-l mx-1 h-6" />

        {/* Undo / Redo */}
        <button onClick={() => exec("undo")} className="px-2 border rounded">↺</button>
        <button onClick={() => exec("redo")} className="px-2 border rounded">↻</button>

        <div className="border-l mx-1 h-6" />

        {/* Colors */}
        <input
          type="color"
          onChange={(e) => exec("foreColor", e.target.value)}
          className="w-8 h-8 border rounded"
          title="Text Color"
        />
        <input
          type="color"
          onChange={(e) => exec("hiliteColor", e.target.value)}
          className="w-8 h-8 border rounded"
          title="Highlight"
        />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        className="flex-1 p-4 outline-none prose border thin-scrollbar"
        contentEditable
        suppressContentEditableWarning
        style={{ minHeight: "400px" }}
      >
        <p>Start typing here...</p>
      </div>
    </div>
  );
};

export default RichTextEditor;
