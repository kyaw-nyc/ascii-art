# ASCII Studio — Image ➜ ASCII (React)

Tiny, fast, and pretty. Drop/paste an image and get crisp, colorized ASCII art right in the browser.  
This fork introduces a **mini preview in the left panel** and **removes the filename pill** in the header.

<img width="1645" height="736" alt="demo" src="https://github.com/user-attachments/assets/ab1c7b8b-a32c-414b-b9ec-e3dca6e5787b" />

---

## ✨ Features
- 🖼️ Drag-and-drop, clipboard paste, or file upload  
- 🎨 Pixel-perfect ASCII mapping (grayscale → charset index)  
- 🌈 Optional **colorized ASCII** using source pixels  
- ⚙️ Live controls: **Preview Zoom**, **Pixel Width**, **Charset presets**  
- 💾 Export to **standalone HTML** (offline-viewable)  
- 🔍 Tiny image preview embedded in the **sidebar**  
- ♿ Smooth gradient UI, keyboard & screen-reader friendly  

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone <your-repo-url> ascii-studio
cd ascii-studio

# 2. Install
npm install

# 3. Run dev
npm run dev

# 4. Build (optional)
npm run build && npm run preview
Node: v18+ recommended (tested with v22).
The app automatically sets the favicon to /favicon.svg at runtime.

🧭 Usage
Upload:

Click Upload,

Drop an image into the sidebar preview, or

Paste directly from clipboard.

Adjust controls:

Preview Zoom → scales the preview only

Pixel Width → sets resolution for ASCII generation

ASCII Charset → define characters from darkest → lightest

Colorize → toggle colored ASCII on/off

Export:

Click Download HTML to save a portable, standalone rendition.

🎛️ Controls & Presets
Classic

ruby
Copy code
.:-=+*#%@&
Blocks

Copy code
 ░▒▓█
Dense

makefile
Copy code
.'`^",:;Il!i><~+_-?][}{1)(|\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$
💡 Tip: Place darker characters first in your charset string for best results.
