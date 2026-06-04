"use client";

import { useRef, useEffect, useCallback, useState } from "react";

/* ── Types ── */
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

/* ── Toolbar Button ── */
function TBtn({
  icon,
  title,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // keep selection
        onClick();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        color: active ? "#059669" : "#475569",
        background: active ? "#ecfdf5" : "transparent",
        transition: "all 0.15s",
      }}
    >
      {icon}
    </button>
  );
}

/* ── Separator ── */
function TSep() {
  return (
    <span
      style={{
        width: 1,
        height: 20,
        background: "#e2e8f0",
        margin: "0 4px",
        flexShrink: 0,
      }}
    />
  );
}

/* ── Main Editor ── */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Viết nội dung tại đây...",
  minHeight = 320,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [, forceUpdate] = useState(0);

  /* Sync external value → editor (only on first mount or when value is set externally) */
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  /* Emit changes */
  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    isInternalChange.current = true;
    const html = editorRef.current.innerHTML;
    onChange(html === "<br>" || html === "<div><br></div>" ? "" : html);
    forceUpdate((n) => n + 1); // re-render to update active states
  }, [onChange]);

  /* ── exec helpers ── */
  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    emitChange();
  };

  const isActive = (cmd: string) => {
    try {
      return document.queryCommandState(cmd);
    } catch {
      return false;
    }
  };

  const currentBlock = () => {
    try {
      return document.queryCommandValue("formatBlock").toLowerCase();
    } catch {
      return "";
    }
  };

  /* ── Heading dropdown ── */
  const handleHeading = (tag: string) => {
    if (tag === "p") {
      exec("formatBlock", "p");
    } else {
      const current = currentBlock();
      if (current === tag) {
        exec("formatBlock", "p");
      } else {
        exec("formatBlock", tag);
      }
    }
  };

  /* ── Insert link ── */
  const insertLink = () => {
    const url = prompt("Nhập URL liên kết:");
    if (url) {
      exec("createLink", url);
    }
  };

  /* ── Insert image ── */
  const insertImage = () => {
    const url = prompt("Nhập URL hình ảnh:");
    if (url) {
      exec("insertImage", url);
    }
  };

  /* ── Current heading for dropdown ── */
  const blockVal = currentBlock();
  const headingLabel =
    blockVal === "h2"
      ? "Tiêu đề lớn"
      : blockVal === "h3"
        ? "Tiêu đề nhỏ"
        : blockVal === "h4"
          ? "Tiêu đề phụ"
          : "Văn bản";

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          padding: "6px 8px",
          borderBottom: "1px solid #e2e8f0",
          background: "#f8fafc",
        }}
      >
        {/* Heading Dropdown */}
        <select
          value={blockVal === "h2" || blockVal === "h3" || blockVal === "h4" ? blockVal : "p"}
          onChange={(e) => handleHeading(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          title="Kiểu đoạn văn"
          style={{
            height: 32,
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            background: "#fff",
            fontSize: 13,
            color: "#334155",
            padding: "0 8px",
            cursor: "pointer",
            outline: "none",
            minWidth: 120,
          }}
        >
          <option value="p">Văn bản thường</option>
          <option value="h2">Tiêu đề lớn</option>
          <option value="h3">Tiêu đề nhỏ</option>
          <option value="h4">Tiêu đề phụ</option>
        </select>

        <TSep />

        {/* Text formatting */}
        <TBtn
          icon={<strong>B</strong>}
          title="In đậm (Ctrl+B)"
          active={isActive("bold")}
          onClick={() => exec("bold")}
        />
        <TBtn
          icon={<em>I</em>}
          title="In nghiêng (Ctrl+I)"
          active={isActive("italic")}
          onClick={() => exec("italic")}
        />
        <TBtn
          icon={<span style={{ textDecoration: "underline" }}>U</span>}
          title="Gạch chân (Ctrl+U)"
          active={isActive("underline")}
          onClick={() => exec("underline")}
        />
        <TBtn
          icon={<span style={{ textDecoration: "line-through", fontSize: 13 }}>S</span>}
          title="Gạch ngang"
          active={isActive("strikeThrough")}
          onClick={() => exec("strikeThrough")}
        />

        <TSep />

        {/* Lists */}
        <TBtn
          icon={<span style={{ fontSize: 16 }}>•≡</span>}
          title="Danh sách chấm"
          active={isActive("insertUnorderedList")}
          onClick={() => exec("insertUnorderedList")}
        />
        <TBtn
          icon={<span style={{ fontSize: 14 }}>1.</span>}
          title="Danh sách số"
          active={isActive("insertOrderedList")}
          onClick={() => exec("insertOrderedList")}
        />

        <TSep />

        {/* Blockquote */}
        <TBtn
          icon={<span style={{ fontSize: 18, fontFamily: "serif" }}>"</span>}
          title="Trích dẫn"
          onClick={() => handleHeading("blockquote")}
        />

        {/* Link */}
        <TBtn
          icon={<span style={{ fontSize: 13 }}>🔗</span>}
          title="Chèn liên kết"
          onClick={insertLink}
        />

        {/* Image */}
        <TBtn
          icon={<span style={{ fontSize: 13 }}>🖼</span>}
          title="Chèn hình ảnh (URL)"
          onClick={insertImage}
        />

        <TSep />

        {/* Undo / Redo */}
        <TBtn
          icon={<span style={{ fontSize: 15 }}>↩</span>}
          title="Hoàn tác (Ctrl+Z)"
          onClick={() => exec("undo")}
        />
        <TBtn
          icon={<span style={{ fontSize: 15 }}>↪</span>}
          title="Làm lại (Ctrl+Y)"
          onClick={() => exec("redo")}
        />

        {/* Align */}
        <TSep />
        <TBtn
          icon={<span style={{ fontSize: 13 }}>≡←</span>}
          title="Căn trái"
          onClick={() => exec("justifyLeft")}
        />
        <TBtn
          icon={<span style={{ fontSize: 13 }}>≡↔</span>}
          title="Căn giữa"
          onClick={() => exec("justifyCenter")}
        />
        <TBtn
          icon={<span style={{ fontSize: 13 }}>≡→</span>}
          title="Căn phải"
          onClick={() => exec("justifyRight")}
        />
      </div>

      {/* ── Editor Area ── */}
      <div style={{ position: "relative" }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          data-placeholder={placeholder}
          style={{
            minHeight,
            maxHeight: 600,
            overflowY: "auto",
            padding: "16px 20px",
            fontSize: 15,
            lineHeight: 1.75,
            color: "#1e293b",
            outline: "none",
          }}
        />
        {/* Placeholder overlay */}
        {(!value || value === "<br>" || value === "<div><br></div>") && (
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 20,
              color: "#94a3b8",
              fontSize: 15,
              pointerEvents: "none",
              lineHeight: 1.75,
            }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {/* ── Editor Styles ── */}
      <style jsx global>{`
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: 700;
          margin: 0.75em 0 0.4em;
          color: #0f172a;
        }
        [contenteditable] h3 {
          font-size: 1.25em;
          font-weight: 700;
          margin: 0.6em 0 0.3em;
          color: #1e293b;
        }
        [contenteditable] h4 {
          font-size: 1.1em;
          font-weight: 600;
          margin: 0.5em 0 0.25em;
          color: #334155;
        }
        [contenteditable] p {
          margin: 0.4em 0;
        }
        [contenteditable] ul,
        [contenteditable] ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        [contenteditable] li {
          margin: 0.2em 0;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #10b981;
          margin: 0.75em 0;
          padding: 0.5em 1em;
          background: #ecfdf5;
          border-radius: 0 8px 8px 0;
          color: #065f46;
          font-style: italic;
        }
        [contenteditable] a {
          color: #059669;
          text-decoration: underline;
        }
        [contenteditable] img {
          max-width: 100%;
          border-radius: 8px;
          margin: 0.75em 0;
        }
        [contenteditable] strong,
        [contenteditable] b {
          font-weight: 700;
        }
        [contenteditable]:focus {
          box-shadow: inset 0 0 0 2px rgba(16, 185, 129, 0.15);
        }
      `}</style>
    </div>
  );
}
