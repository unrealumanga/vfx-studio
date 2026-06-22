# ⚡ VFX Studio — AI Creative Suite (Phase 1 MVP)

<div align="center">
  <img src="public/favicon.svg" width="120" alt="VFX Studio Logo" />
  
  ### *The Browser-Based Hollywood VFX & Architectural Visualization Engine*

  [![React](https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vite.dev)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
  [![Fabric.js](https://img.shields.io/badge/Fabric.js-7.4-pink?logo=html5&logoColor=white)](https://fabricjs.com)
  [![Zustand](https://img.shields.io/badge/Zustand-5.0-red?logo=react&logoColor=white)](https://github.com/pmndrs/zustand)
  [![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

  **Live Site:** [https://unrealumanga.github.io/vfx-studio/](https://unrealumanga.github.io/vfx-studio/)
</div>

---

## 📽 Overview

**VFX Studio** is a client-side, browser-only creative sandbox engineered for spatial designers, VFX artists, and AI prompt engineers who demand absolute control over model execution without SaaS walls, intermediate server storage, or monthly fees.

By providing **your own API keys**, VFX Studio bypasses direct platform subscriptions and routes your prompts directly to leading-edge models (Google Imagen 3, Veo 2, OpenAI DALL·E 3, GPT-4o, Anthropic Claude, and Replicate Flux) through a stateless connection. All configurations are protected in a client-side AES-256-GCM KeyVault, ensuring absolute privacy.

---

## ✨ Features (Phase 1 MVP)

### 🎨 1. Text-to-Image Generation (`Gen`)
- Route prompts dynamically to Google Imagen 3, DALL-E 3, or Replicate Flux.
- Set aspect ratios (`1:1`, `16:9`, `9:16`, `4:3`, `3:2`, `21:9`) and rendering qualities (`Draft`, `Standard`, `Ultra`).

### ✂ 2. Interactive Inpaint Masking (`Edit`)
- Powered by a GPU-accelerated **Fabric.js** editor.
- Draw precise mask layers over reference images using a responsive pencil brush.
- Automates solid white on solid black alpha mask exports for inpainting models on the fly.

### 🏛 3. First-Class Architectural Visualization (`ArchViz`)
- Built for spatial and experiential designers.
- Fine-tune renders with specialized dropdowns for **Camera Angles**, **Lighting & Time of Day**, and **Material Presets**.
- Integrates selections with advanced prompt augmentation.

### ✦ 4. Prompt Assist & Expansion (`Prompt`)
- Harnesses Claude Sonnet 3.5 & GPT-4o to expand simple ideas into production-ready cinematic prompt structures with rich lighting and framing terminology.

---

## 🛠 Tech Stack

- **UI & Layout:** React 19, Tailwind CSS v4 (native `@theme` and dynamic CSS variables).
- **Core State Engine:** Zustand v5 (with localStorage persistence).
- **GPU Canvas Editor:** Fabric.js 7.x (brush tracking and responsive image scaling).
- **Decentralized History:** IndexedDB (via the lightweight `idb` library).
- **API Key Protection:** Browser Web Crypto API (AES-256-GCM encryption with PBKDF2 salt derivation).

---

## 🔒 Security Architecture (Zero Trust)

```
                       ┌──────────────────────────────────────┐
                       │       Browser (Local Storage)        │
                       │                                      │
 ┌───────────────┐     │  ┌──────────────┐  ┌──────────────┐  │
 │  Passphrase  ─┼─────┼─►│  AES-256-GCM │  │  Zustand VM  │  │
 └───────────────┘     │  │  Decryption  │  │ (Keys Store) │  │
                       │  └──────┬───────┘  └──────┬───────┘  │
                       └─────────┼─────────────────┼──────────┘
                                 ▼                 ▼
                       ┌──────────────────────────────────────┐
                       │        Direct Provider Fetch         │
                       │  (Authorization Bearer / Headers)    │
                       └─────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┼──────────────────────┐
                 ▼                       ▼                      ▼
         ┌───────────────┐       ┌───────────────┐      ┌───────────────┐
         │   Google AI   │       │    OpenAI     │      │   Replicate   │
         │  (Imagen/Veo) │       │ (DALL-E/GPT)  │      │ (Flux/ESRGAN) │
         └───────────────┘       └───────────────┘      └───────────────┘
```

- **In-Memory Keys:** Stored API keys are never held in plaintext on disk. They reside encrypted using AES-256-GCM in localStorage.
- **Passphrase Locked:** Keys are only decrypted in-memory during active sessions.
- **CORS Passthrough:** Includes a stateless, serverless Cloudflare Worker proxy (`workers/cors-proxy.ts`) only for APIs that block direct browser CORS. It does not log, track, or save keys.

---

## 🚀 Quick Start

### 1. Clone & Setup Dependencies
Ensure you have [Bun](https://bun.sh) installed.
```bash
git clone https://github.com/unrealumanga/vfx-studio.git
cd vfx-studio
bun install
```

### 2. Run Local Development Server
```bash
bun run dev
```
Open [http://localhost:5173/vfx-studio/](http://localhost:5173/vfx-studio/) in your browser.

### 3. Build & Production Check
Verify type safety and compile chunks:
```bash
bun run build
```

---

## 🌐 SEO & Web Discovery

To help researchers, developers, and visual artists find this project, the repository is optimized with the following index tags:

`vfx-studio` · `creative-tech` · `generative-ai` · `archviz` · `fabricjs` · `react-ai` · `google-imagen` · `veo2` · `dalle3` · `replicate-flux` · `prompt-engineering` · `aes-256-gcm` · `client-side-inference` · `web-vfx` · `unreal-engine`

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
