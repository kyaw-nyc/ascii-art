import React, { useEffect, useMemo, useRef, useState } from "react";

export default function App() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [asciiHtml, setAsciiHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [imgName, setImgName] = useState("");
  const [imgUrl, setImgUrl] = useState("");

  const [zoom, setZoom] = useState(0.25);
  const [finalWidth, setFinalWidth] = useState(200);
  const [asciiSet, setAsciiSet] = useState(" .:-=+*#%@&");
  const [colorize, setColorize] = useState(true);

  const SCALE_X = 1.05;
  const EXPORT_FONT_PX = 14;

  useEffect(() => {
    try {
      const href = "/favicon.svg";
      const type = "image/svg+xml";
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "icon");
        document.head.appendChild(link);
      }
      link.setAttribute("type", type);
      link.setAttribute("href", href);
    } catch {}
  }, []);

  const asciiList = useMemo(
    () => asciiSet.split("").map((c) => (c === "" ? " " : c)),
    [asciiSet]
  );

  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    handleFile(f);
  }

  function handleFile(file) {
    setImgName(file.name);
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    renderAscii(url, finalWidth, asciiList, colorize);
  }

  async function renderAscii(url, FINAL_WIDTH, ASCII_LIST, useColor) {
    try {
      setBusy(true);
      const img = await loadImage(url);

      // A) widen 5%
      const stageA = document.createElement("canvas");
      const aCtx = stageA.getContext("2d");
      stageA.width = Math.round(img.width * SCALE_X);
      stageA.height = img.height;
      aCtx.drawImage(img, 0, 0, stageA.width, stageA.height);

      // B) pixelate to FINAL_WIDTH
      const finalW = Math.max(1, Math.round(FINAL_WIDTH));
      const finalH = Math.max(1, Math.round((stageA.height * finalW) / stageA.width));
      const stageB = document.createElement("canvas");
      const bCtx = stageB.getContext("2d");
      stageB.width = finalW;
      stageB.height = finalH;
      bCtx.imageSmoothingEnabled = false;
      bCtx.drawImage(stageA, 0, 0, finalW, finalH);

      const { data } = bCtx.getImageData(0, 0, finalW, finalH);

      const n = ASCII_LIST.length || 1;
      let html = "";
      for (let y = 0; y < finalH; y++) {
        for (let x = 0; x < finalW; x++) {
          const i = (y * finalW + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          const ai = Math.min(n - 1, Math.floor((gray * n) / 256));
          const ch = ASCII_LIST[ai] ?? " ";
          const colorStyle = useColor ? `color:${rgbToHex(r, g, b)};` : "";
          html += `<span style="${colorStyle} font-weight:bold;">${escapeHtml(ch)}</span>`;
        }
        html += "<br>";
      }

      setAsciiHtml(html);

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = stageB.width;
        canvas.height = stageB.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(stageB, 0, 0);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to process image. Try a smaller image.");
    } finally {
      setBusy(false);
    }
  }

  function handleRebuild() {
    if (!imgUrl) return;
    renderAscii(imgUrl, finalWidth, asciiList, colorize);
  }

  function buildStandaloneHtml(fontPx = 32) {
    const bg = "#000";
    const fg = "#fff";
    return `<!doctype html>
<html><head><meta charset="utf-8"><title>ASCII Html Output</title></head>
<body style='background-color:${bg}; margin:0; padding:16px; color:${fg};'>
<pre style='display:inline-block; border-width:4px 6px; border-color:${bg}; border-style:solid; background-color:${bg}; font-size:${fontPx}px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-weight:bold; line-height:60%'>
${asciiHtml}
</pre></body></html>`;
  }

  function handleExportHtml() {
    const doc = buildStandaloneHtml(EXPORT_FONT_PX);
    const blob = new Blob([doc], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (imgName ? imgName.replace(/\.[^.]+$/, "") : "ascii-art") + ".html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }
  function onDragOver(e) { e.preventDefault(); }

  useEffect(() => {
    function onPaste(e) {
      const item = [...(e.clipboardData?.items || [])].find((it) => it.type.startsWith("image/"));
      if (item) {
        const file = item.getAsFile();
        if (file) handleFile(file);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  useEffect(() => {
    if (imgUrl) handleRebuild();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalWidth, asciiSet, colorize]);

  return (
    <div className="app-shell" style={appShell}>
      <style dangerouslySetInnerHTML={{ __html: globalCss }} />

      {/* ===== Header ===== */}
      <header className="header">
        <div className="brand">
          <span className="logo">A</span>
          <div className="titles">
            <h1>ASCII Studio</h1>
            <p className="subtitle">Image → ASCII, pixel-perfect</p>
          </div>
        </div>

        <div className="actions">
          <label className="btn primary" title="Upload image">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPickFile}
              style={{ display: "none" }}
            />
            Upload
          </label>
          <button className="btn" onClick={handleExportHtml} disabled={!asciiHtml}>
            Download HTML
          </button>
          {/* ★ removed the filename pill per request */}
        </div>
      </header>

      {/* ===== Controls + Content ===== */}
      <main className="main">
        {/* ===== Sidebar ===== */}
        <aside className="sidebar card">
          <h3 className="card-title">Image</h3>

          {/* ★ Tiny preview + dropzone moved here */}
          <div
            className="dropzone mini"
            onDrop={onDrop}
            onDragOver={onDragOver}
            title="Drop / paste / Upload"
          >
            {imgUrl ? (
              <img src={imgUrl} alt="uploaded" className="preview mini" />
            ) : (
              <div className="hint">
                <div className="hint-icon">⬆︎</div>
                <div className="hint-text">
                  Drop or paste an image, or click <span className="tag">Upload</span>.
                </div>
              </div>
            )}
          </div>

          <h3 className="card-title">Controls</h3>

          <div className="control">
            <label>Preview Zoom</label>
            <div className="row">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
              />
              <span className="val">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          <div className="control">
            <label>Pixel Width</label>
            <div className="row">
              <input
                type="range"
                min="40"
                max="320"
                step="4"
                value={finalWidth}
                onChange={(e) => setFinalWidth(parseInt(e.target.value, 10))}
              />
              <span className="val">{finalWidth}px</span>
            </div>
          </div>

          <div className="control">
            <label>ASCII Charset (dark → light)</label>
            <input
              className="text"
              value={asciiSet}
              onChange={(e) => setAsciiSet(e.target.value || " ")}
              spellCheck={false}
            />
            <div className="row gap">
              <PresetButton onClick={() => setAsciiSet(" .:-=+*#%@&")}>Classic</PresetButton>
              <PresetButton onClick={() => setAsciiSet(" ░▒▓█")}>Blocks</PresetButton>
              <PresetButton onClick={() => setAsciiSet(" .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$")}>Dense</PresetButton>
            </div>
          </div>

          <div className="control">
            <label>Colorize</label>
            <div className="row tight">
              <Toggle checked={colorize} onChange={setColorize} />
              <span className="val toggle-label">{colorize ? "On" : "Off"}</span>
            </div>
          </div>
        </aside>

        {/* ===== Workspace (ASCII only now) ===== */}
        <section className="workspace">
          {/* ★ Dropzone removed from here */}
          <div className="ascii card">
            <pre
              style={
                asciiHtml
                  ? { ...PRE_STYLE, fontSize: Math.max(8, Math.round(PRE_STYLE.fontSize * zoom)) }
                  : PLACEHOLDER_PRE_STYLE
              }
              dangerouslySetInnerHTML={{
                __html: asciiHtml || escapeHtml(placeholderAscii),
              }}
            />
          </div>
        </section>
      </main>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

/* ---------- UI Subcomponents ---------- */
function Toggle({ checked, onChange }) {
  return (
    <button
      className={`toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
      type="button"
      aria-pressed={checked}
    >
      <span className="knob" />
    </button>
  );
}

function PresetButton({ children, onClick }) {
  return (
    <button className="btn tiny" onClick={onClick} type="button">
      {children}
    </button>
  );
}

/* ---------- Helpers ---------- */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(str) {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/* ---------- Styles ---------- */
const appShell = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100%",
  background:
    "radial-gradient(1200px 600px at 10% -10%, rgba(43,92,255,.25), rgba(0,0,0,0)) , radial-gradient(900px 500px at 90% 10%, rgba(255,76,140,.25), rgba(0,0,0,0)) , linear-gradient(120deg, #0b0f1a 0%, #070a12 100%)",
  color: "#e9ecf3",
  padding: 16,
  display: "flex",
  flexDirection: "column",
};

const PRE_STYLE = {
  display: "inline-block",
  borderWidth: "4px 6px",
  borderColor: "black",
  borderStyle: "solid",
  backgroundColor: "black",
  fontSize: 32,
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontWeight: "bold",
  lineHeight: "60%",
  margin: 0,
  whiteSpace: "pre",
  color: "#ffffff",
};

const PLACEHOLDER_PRE_STYLE = {
  ...PRE_STYLE,
  fontSize: 14,
  lineHeight: "120%",
  backgroundColor: "transparent",
  borderStyle: "dashed",
  borderColor: "rgba(255,255,255,.15)",
  color: "var(--muted)",
};

const globalCss = `
  html, body, #root { height: 100%; width: 100%; }
  body { margin: 0; overflow-x: hidden; }
  :root {
    --card: rgba(255,255,255,0.06);
    --card-border: rgba(255,255,255,0.12);
    --muted: rgba(233,236,243,.7);
    --accent: #7c9cff;
    --accent-2: #ff6aa9;
  }

  * { box-sizing: border-box; }
  .header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding: 16px 10px 6px; }
  .brand { display:flex; align-items:center; gap:8px; }
  .logo { display:grid; place-items:center; width:36px; height:36px; border-radius:10px; font-weight:900; letter-spacing:-.02em; background: linear-gradient(135deg, var(--accent), var(--accent-2)); color:#fff; box-shadow: 0 8px 20px rgba(0,0,0,.25); }
  .titles h1 { font-size: clamp(18px, 3vw, 28px); letter-spacing:-.01em; margin:0; }
  .titles .subtitle { opacity:.8; margin:2px 0 0 0; font-size:12px; }
  .actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }

  .btn { padding: 10px 14px; border-radius: 12px; border: 1px solid var(--card-border); background: var(--card); color: #fff; font-weight: 700; letter-spacing: .2px; cursor: pointer; transition: transform .12s ease, box-shadow .12s ease, background .2s; text-decoration:none; }
  .btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(0,0,0,.25); }
  .btn:disabled { opacity: .6; cursor: not-allowed; }
  .btn.primary { background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04)); border: 1px solid rgba(255,255,255,.18); }
  .btn.tiny { padding: 6px 10px; font-size: 12px; border-radius: 999px; }

  .main { display:grid; grid-template-columns: 340px 1fr; gap: 16px; width: min(1280px, 94vw); margin: 10px auto 24px; }
  @media (max-width: 980px) { .main { grid-template-columns: 1fr; } }

  .card { position:relative; border-radius: 16px; border: 1px solid var(--card-border); background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02)); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
  .card-title { font-size: 14px; font-weight: 800; letter-spacing:.4px; text-transform: uppercase; opacity:.9; padding: 12px 12px 0; margin:0 0 6px; }

  .sidebar { padding: 10px 12px 14px; display:flex; flex-direction:column; gap: 12px; }
  .control { display:flex; flex-direction:column; gap: 6px; }
  .control label { font-size: 12px; opacity:.9; }
  .control .row { display:flex; align-items:center; gap:10px; }
  .control .row.tight { gap:4px; }
  .control .row.gap { gap:6px; flex-wrap:wrap; }
  .control .val { font-size: 12px; opacity:.9; min-width: 44px; text-align:right; font-variant-numeric: tabular-nums; }
  .control .toggle-label { margin-left: 2px; }
  .control .text { width:100%; padding: 10px 12px; border-radius: 10px; background: rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.14); color:#fff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace; }

  .toggle { width: 46px; height: 26px; border-radius: 999px; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.25); display:flex; align-items:center; padding:2px; transition: background .2s ease; }
  .toggle .knob { width: 22px; height: 22px; background:#fff; border-radius:999px; transform: translateX(0); transition: transform .2s ease; }
  .toggle.on { background: linear-gradient(90deg, var(--accent), var(--accent-2)); }
  .toggle.on .knob { transform: translateX(20px); }

  .workspace { display:grid; grid-template-columns: 1fr; gap: 16px; }

  /* ★ Tiny preview in sidebar */
  .dropzone.mini { position:relative; height: 110px; min-height: 110px; display:flex; align-items:center; justify-content:center; overflow:hidden; border-radius:12px; }
  .preview.mini { height: 100%; width: auto; max-width: 100%; object-fit: contain; display:block; }
  .dropzone.mini::after { content:""; position:absolute; inset:0; pointer-events:none; border-radius:12px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), inset 0 30px 90px rgba(124,156,255,.08); }

  /* (kept for old workspace styling) */
  .hint { text-align:center; color: var(--muted); display:flex; flex-direction:column; align-items:center; gap:8px; padding: 12px; }
  .hint-icon { font-size: 28px; opacity:.9; }
  .tag { background: rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18); padding: 1px 6px; border-radius: 6px; }

  .ascii { padding: 12px; overflow:auto; max-height: 70vh; border-radius:16px; }
`;

const placeholderAscii = `Drop/paste an image to render ASCII here.\nCharset: &@#*+=-:.,  (dark → light)`;

(function devSelfTests(){
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production') {
      console.assert(rgbToHex(255,0,16) === '#ff0010', 'rgbToHex failed');
      console.assert(rgbToHex(0,0,0) === '#000000', 'rgbToHex failed on zeros');
      console.assert(escapeHtml('<&>') === '&lt;&amp;&gt;', 'escapeHtml failed');

      const n = 10;
      const idx0 = Math.floor((0 * n) / 256);
      const idx255 = Math.floor((255 * n) / 256);
      console.assert(idx0 === 0, 'idx0 should be 0');
      console.assert(idx255 === n - 1, 'idx255 should be n-1');

      const w = 1000, h = 500, scaleX = 1.05, finalW = 200;
      const aW = Math.round(w * scaleX);
      const fH = Math.max(1, Math.round((h * finalW) / aW));
      console.assert(fH > 0, 'final height should be > 0');

      console.log('[devSelfTests] ok');
    }
  } catch (e) {
    console.warn('[devSelfTests] failed', e);
  }
})();
