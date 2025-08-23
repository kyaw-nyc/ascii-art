import React, { useRef, useState } from "react";

// App.jsx — Vite React (pure web)
// ✨ Pretty UI polish while preserving your exact Java logic
// - Charset: "&@#*+=-:., " (dark → light)
// - Luminance: idx = floor(lum/256 * (len-1)), lum = 0.2126R + 0.7152G + 0.0722B
// - Grayscale color: #GGGGGG from 0.299R + 0.587G + 0.114B
// - Step: 20 px (both axes)
// - <pre> line-height: 60% to avoid vertical gaps

export default function App() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [asciiHtml, setAsciiHtml] = useState("");
  const [imgName, setImgName] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [busy, setBusy] = useState(false);

  // Optional: point this at your repo for PNG instructions
  const GITHUB_REPO_URL = "https://github.com/yourname/your-wkhtmltoimage-repo"; // ← change me

  const ASCII = "&@#*+=-:., ";
  const STEP = 20; // pixels
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

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Match original image size (no scaling to preserve logic)
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const { data, width: w, height: h } = ctx.getImageData(0, 0, img.width, img.height);

      const lastIndex = ASCII.length - 1;
      let html = "";

      for (let y = 0; y < h; y += STEP) {
        for (let x = 0; x < w; x += STEP) {
          const i = (y * w + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Luminance for character selection (Rec.709)
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b; // 0..255
          const idx = Math.floor((lum / 256) * lastIndex);
          const ch = ASCII.charAt(Math.max(0, Math.min(lastIndex, idx))) || " ";

          // Grayscale for color
          const gs = Math.max(0, Math.min(255, Math.round(0.299 * r + 0.587 * g + 0.114 * b)));
          const hex = rgbToHex(gs, gs, gs);

          html += `<span style="color:${hex}; font-weight: bold;">${escapeHtml(ch)}</span>`;
        }
        html += "<br>"; // row break
      }

      setAsciiHtml(html);
    } catch (e) {
      console.error(e);
      alert("Failed to process image. Try a smaller image.");
    } finally {
      setBusy(false);
    }
  }

  function handleExportHtml() {
    const doc = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>ASCII Html Output file</title>
</head>
<body style='background-color:black'>
<pre style='display: inline-block; border-width: 4px 6px; border-color: black; border-style: solid; background-color:black; font-size: 32px; font-face: Montserrat; font-weight: bold; line-height:60%'>
${asciiHtml}
</pre>
</body>
</html>`;
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
          <a className="btn ghost" href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
            PNG via wkhtmltoimage ↗
          </a>
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
          <pre style={asciiHtml ? PRE_STYLE : PLACEHOLDER_PRE_STYLE} dangerouslySetInnerHTML={{ __html: asciiHtml || escapeHtml(placeholderAscii) }} />
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
  .subtitle { margin: 8px 0 14px; color: var(--muted); }

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

  .footer { margin: 18px auto 0; width: min(1280px, 92vw); display:flex; justify-content:center; color: var(--muted); font-size: 12px; }
`;

const placeholderAscii = `Drop an image or click Upload to render ASCII here.
Charset: &@#*+=-:.,  (dark → light)`;
