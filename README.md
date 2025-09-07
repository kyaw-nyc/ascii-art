# ascii-art

ASCII Studio — Image ➜ ASCII (React)

Tiny, fast, and pretty. Drop/paste an image and get crisp, colorized ASCII art in the browser. This fork uses a mini preview in the left panel and hides the filename pill in the header per product spec.

<img width="1645" height="736" alt="image" src="https://github.com/user-attachments/assets/ab1c7b8b-a32c-414b-b9ec-e3dca6e5787b" />

✨ Features

Drag-and-drop, clipboard paste, or file upload

Pixel-perfect ASCII mapping (grayscale → charset index)

Optional colorized ASCII using the source pixels

Live controls: Preview Zoom, Pixel Width, Charset presets

Export to standalone HTML (offline-viewable)

Tiny image preview embedded in the sidebar (not centered)

Smooth gradient UI, keyboard & screen-reader friendly

🚀 Quick Start
# 1) Clone
git clone <your-repo-url> ascii-studio
cd ascii-studio

# 2) Install
npm install

# 3) Dev
npm run dev

# 4) Build (optional)
npm run build && npm run preview


Node: v18+ recommended (works great on v22).
The app sets the favicon to /favicon.svg at runtime.

🧭 Usage

Upload: Click Upload, or just drop an image into the sidebar preview, or paste from clipboard.

Tweak controls:

Preview Zoom — UI preview scale only (doesn’t change the ASCII itself)

Pixel Width — number of pixels used horizontally for ASCII generation

ASCII Charset — define dark→light order; try Classic, Blocks, Dense

🎛️ Controls & Presets

Classic: .:-=+*#%@&

Blocks: ░▒▓█

Dense: .'^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$`
Tip: Darker characters should appear first in the charset string.

Colorize — toggle color spans on/off

Download HTML to save a portable rendition (opens anywhere offline).
