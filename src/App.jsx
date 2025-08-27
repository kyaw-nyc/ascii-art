import React, { useRef, useState, useEffect } from "react";

// App.jsx — Vite React (pure web)
// ✨ Pretty UI polish while preserving pipeline logic
// Python-style flow:
// 1) widen 5% (like get_image)
// 2) pixelate to FINAL_WIDTH (keep aspect)
// 3) grayscale → ASCII index: int(gray * len(chars) / 256)
// 4) color from pixelated color image
// 5) render in <pre> with line-height: 60%

export default function App() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // STATE
  const [asciiHtml, setAsciiHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [imgName, setImgName] = useState("");
  const [imgUrl, setImgUrl] = useState("");

  // —— ensure favicon points to /favicon.svg at runtime ——
  useEffect(() => {
    try {
      const href = '/favicon.svg';
      const type = 'image/svg+xml';
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'icon');
        document.head.appendChild(link);
      }
      link.setAttribute('type', type);
      link.setAttribute('href', href);
    } catch {}
  }, []);

  // UI zoom for ASCII preview (0.10x – 1.00x). Default 0.25 to "zoom out" the preview.
  const [zoom, setZoom] = useState(0.25);

  const ASCII_LIST = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@", "&"]; // python list
  const FINAL_WIDTH = 200; // pixelate target width
  const SCALE_X = 1.05; // widen 5%
  const EXPORT_FONT_PX = 14; // smaller export font to keep HTML compact

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

  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    handleFile(f);
  }

  function handleFile(file) {
    setImgName(file.name);
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    renderAscii(url);
  }

  async function renderAscii(url) {
    try {
      setBusy(true);
      const img = await loadImage(url);

      // Stage A: widen horizontally by 5%
      const stageA = document.createElement("canvas");
      const aCtx = stageA.getContext("2d");
      stageA.width = Math.round(img.width * SCALE_X);
      stageA.height = img.height;
      aCtx.drawImage(img, 0, 0, stageA.width, stageA.height);

      // Stage B: pixelate to FINAL_WIDTH (preserve aspect)
      const finalW = FINAL_WIDTH;
      const finalH = Math.max(1, Math.round((stageA.height * finalW) / stageA.width));
      const stageB = document.createElement("canvas");
      const bCtx = stageB.getContext("2d");
      stageB.width = finalW;
      stageB.height = finalH;
      bCtx.imageSmoothingEnabled = false; // crisp pixelation
      bCtx.drawImage(stageA, 0, 0, finalW, finalH);

      // Read pixelated color data
      const { data } = bCtx.getImageData(0, 0, finalW, finalH);

      // Build ASCII using grayscale mapping from the python code
      const n = ASCII_LIST.length;
      let html = "";
      for (let y = 0; y < finalH; y++) {
        for (let x = 0; x < finalW; x++) {
          const i = (y * finalW + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // grayscale like PIL ImageOps.grayscale
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          const ai = Math.floor((gray * n) / 256);
          const ch = ASCII_LIST[ai] ?? " ";
          const hex = rgbToHex(r, g, b); // color from color image
          html += `<span style="color:${hex}; font-weight:bold;">${escapeHtml(ch)}</span>`;
        }
        html += "<br>";
      }

      setAsciiHtml(html);

      // store to hidden canvas if needed later
      const canvas = canvasRef.current;
      canvas.width = stageB.width;
      canvas.height = stageB.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(stageB, 0, 0);
    } catch (e) {
      console.error(e);
      alert("Failed to process image. Try a smaller image.");
    } finally {
      setBusy(false);
    }
  }

  function buildStandaloneHtml(fontPx = 32) {
    return `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>ASCII Html Output file</title>\n</head>\n<body style='background-color:black'>\n<pre style='display: inline-block; border-width: 4px 6px; border-color: black; border-style: solid; background-color:black; font-size: ${fontPx}px; font-face: Montserrat; font-weight: bold; line-height:60%'>\n${asciiHtml}\n</pre>\n</body>\n</html>`;
  }

  function handleExportHtml() {
    const doc = buildStandaloneHtml(EXPORT_FONT_PX); // smaller export font → smaller HTML
    const blob = new Blob([doc], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (imgName ? imgName.replace(/\.[^.]+$/, "") : "ascii-art") + ".html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Drag & Drop handlers
  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }
  function onDragOver(e) { e.preventDefault(); }

  return (
    <div className="app-shell" style={appShell}>
      {/* Global prettifying CSS (animations, hover) */}
      <style dangerouslySetInnerHTML={{ __html: globalCss }} />
      <style dangerouslySetInnerHTML={{ __html: zoomCss }} />

      <header className="hero">
        <div className="glow" />
        <h1>
          <span className="logo">▞▚</span> Image → ASCII
        </h1>

        <div className="toolbar">
          <label className="btn primary" title="Upload image">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPickFile}
              style={{ display: "none" }}
            />
            Upload Image
          </label>
          <button className="btn" onClick={handleExportHtml} disabled={!asciiHtml}>
            Download HTML
          </button>
          <div className="zoomctl" title="Preview zoom (does not affect downloads)">
            <span className="zoomlabel">Zoom</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={zoom}
              onChange={(e)=>setZoom(parseFloat(e.target.value))}
            />
            <span className="zoomval">{Math.round(zoom*100)}%</span>
          </div>
          {busy && <span className="badge">Processing…</span>}
        </div>
      </header>

      <main className="content">
        <section className="dropzone" onDrop={onDrop} onDragOver={onDragOver}>
          {imgUrl ? (
            <img src={imgUrl} alt="uploaded" className="preview" />
          ) : (
            <div className="hint">
              <div className="hint-icon">⬆︎</div>
              <div className="hint-text">Drag & drop an image here or click “Upload Image”</div>
            </div>
          )}
        </section>

        <section className="panel ascii">
          <pre
            style={asciiHtml ? { ...PRE_STYLE, fontSize: Math.max(8, Math.round(PRE_STYLE.fontSize * zoom)) } : PLACEHOLDER_PRE_STYLE}
            dangerouslySetInnerHTML={{ __html: asciiHtml || escapeHtml(placeholderAscii) }}
          />
        </section>
      </main>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

// ---------- helpers ----------

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
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(str) {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// ---------- dev self-tests (run in dev only) ----------
(function devSelfTest(){
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production') {
      // Test grayscale → index bounds
      const n = ASCII_LIST.length;
      const idx0 = Math.floor((0 * n) / 256);
      const idx255 = Math.floor((255 * n) / 256);
      console.assert(idx0 === 0, 'Expected idx0===0, got', idx0);
      console.assert(idx255 === n - 1, 'Expected idx255===n-1, got', idx255);

      // Test a mid gray maps to a valid index
      const mid = Math.floor((128 * n) / 256);
      console.assert(mid >= 0 && mid < n, 'Mid index out of range', mid);

      // Test final dims computation
      const w = 1000, h = 500; // example
      const aW = Math.round(w * SCALE_X);
      const fW = FINAL_WIDTH;
      const fH = Math.max(1, Math.round((h * fW) / aW));
      console.assert(fH > 0, 'Final H should be > 0');
      // eslint-disable-next-line no-console
      console.log('[devSelfTest] ok');
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[devSelfTest] failed', e);
  }
})();

// ---------- styles ----------

const appShell = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100%",
  background:
    "radial-gradient(1200px 600px at 10% -10%, rgba(43,92,255,.25), rgba(0,0,0,0)) , radial-gradient(900px 500px at 90% 10%, rgba(255,76,140,.25), rgba(0,0,0,0)) , linear-gradient(120deg, #0b0f1a 0%, #070a12 100%)",
  color: "#e9ecf3",
  padding: 24,
  display: "flex",
  flexDirection: "column",
};

const globalCss = `
  html, body, #root { height: 100%; width: 100%; }
  body { margin: 0; background: #070a12; overflow-x: hidden; }
  :root {
    --card: rgba(255,255,255,0.06);
    --card-border: rgba(255,255,255,0.12);
    --muted: rgba(233,236,243,.7);
    --accent: #7c9cff;
    --accent-2: #ff6aa9;
  }
  * { box-sizing: border-box; }
  .hero { position: relative; padding: 16px 8px 8px; text-align: center; }
  .hero .glow { position:absolute; inset:-20px; background: radial-gradient(600px 180px at 50% 0%, rgba(124,156,255,0.25), transparent 60%); filter: blur(20px); pointer-events:none; }
  .hero h1 { font-size: clamp(28px, 3.5vw, 46px); margin: 0; font-weight: 900; letter-spacing: -0.02em; }
  .logo { display:inline-block; margin-right:.3em; background: linear-gradient(90deg, var(--accent), var(--accent-2)); -webkit-background-clip:text; color:transparent; }

  .toolbar { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; align-items:center; margin-top:12px; }
  .btn { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--card-border); background: var(--card); color: #fff; font-weight: 700; letter-spacing: .2px; cursor: pointer; transition: transform .12s ease, box-shadow .12s ease, background .2s; text-decoration:none; }
  .btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(0,0,0,.25); }
  .btn:disabled { opacity: .6; cursor: not-allowed; }
  .btn.primary { background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04)); border: 1px solid rgba(255,255,255,.18); }
  .btn.ghost { background: transparent; border: 1px dashed var(--card-border); }
  .badge { background: rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18); padding: 6px 10px; border-radius: 999px; font-size: 12px; }

  .content { margin: 18px auto 0; display: grid; grid-template-columns: minmax(260px, 420px) minmax(320px, 1fr); gap: 18px; width: min(1280px, 92vw); }
  @media (max-width: 900px) { .content { grid-template-columns: 1fr; } }

  .dropzone { position: relative; min-height: 280px; border-radius: 16px; border: 1px dashed var(--card-border); background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02)); display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .dropzone::after { content:""; position:absolute; inset:0; pointer-events:none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.05), inset 0 40px 120px rgba(124,156,255,.08); border-radius:16px; }
  .preview { width: 100%; height: auto; display:block; border-radius: 12px; }
  .hint { text-align:center; color: var(--muted); display:flex; flex-direction:column; align-items:center; gap:8px; padding: 18px; }
  .hint-icon { font-size: 36px; opacity:.9; }

  .panel.ascii { background: rgba(0,0,0,.55); border: 1px solid rgba(255,255,255,.12); border-radius: 16px; padding: 12px; overflow:auto; max-height: 70vh; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
`;

const zoomCss = `
  .zoomctl { display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:10px; border:1px solid var(--card-border); background: var(--card); }
  .zoomctl input[type=range]{ width:140px; accent-color: var(--accent); }
  .zoomctl .zoomlabel{ color:#d8dbe4; font-size:12px; opacity:.9; }
  .zoomctl .zoomval{ width:40px; text-align:right; font-variant-numeric: tabular-nums; color:#fff; font-size:12px; }
`;

const placeholderAscii = `Drop an image or click Upload to render ASCII here.\nCharset: &@#*+=-:.,  (dark → light)`;

// —— Export size note ——
// To change exported HTML scale without affecting on-screen preview,
// tweak EXPORT_FONT_PX above (e.g., 12, 14, 16).
