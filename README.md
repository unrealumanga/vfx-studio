# VFX.STUDIO — Generative Visual Lab

**The quiet, multi-model creative studio that works for you — not for a platform.**

One prompt. Every major foundation model. Zero subscriptions. VFX Studio connects your own API keys directly to the world's best generation models and orchestrates them seamlessly in a single, beautiful browser session.

🚀 **[LAUNCH LIVE GENERATIVE LAB](https://unrealumanga.github.io/vfx-studio/)**

---

## ⚡ Direct Multi-Model Orchestration & Wholesale Pricing

VFX Studio is an Awwwards-inspired, serverless visual playground designed for spatial designers, VFX artists, and creative engineers. Instead of locking you behind monthly subscription walls, it lets you bring your own keys (BYOK) and pay only wholesale cost directly to the model providers.

### 🎭 Mix, Match, and Orchestrate
- **Unified Pipeline:** Route prompts dynamically—Gemini for high-fidelity stills, Veo/Runway/Luma for fluid motion, and Claude/GPT for prompt amplification.
- **Wholesale Pricing (BYOK):** No middleman markups. Pay only for what you render directly to Google, OpenAI, Replicate, Runway, or Fal.ai.
- **Client-Side Privacy:** Your prompts, metadata, and generated assets remain strictly inside your browser's local **IndexedDB** database sandbox. We do not (and physically cannot) log or store your generations.
- **Encrypted Sandbox:** Your API keys are locked on your device using standard **AES-256-GCM** client-side encryption. They are held in volatile tab memory only during active browser sessions and are never sent to external servers.

---

## 🔮 Clean Aesthetics & V8 Features

The workspace utilizes a quiet, low-fatigue layout designed to keep your artwork as the sole focus:

### 1. Minimal Gray Theme ☀️🌙
A dual-mode, editorial layout (clean off-white in light mode, soft warm dark-charcoal in dark mode) featuring fluid underlined tab links, flat surfaces, and responsive base-16px text sizes.

### 2. Collapsible Settings Sidebar ◂▸
Fold away parameter panels cleanly into a narrow vertical strip using smooth CSS transitions to expand the display canvas to full width when drawing or reviewing.

### 3. Full-Screen Masking & Box Selector ✂
Draw or erase masks directly over reference images using a visible ink canvas. Includes a togglable **Rect Tool** with dotted marching-ants highlights for quick box selection masking.

### 4. In-Context Quick Upscaler ✦
Enhance details and sharpen current results instantly. Clicking upscale on any image triggers a pop-over modal overlay to select **2x, 3x, or 4x** resolution factors without leaving your active workspace.

### 5. Multi-Provider Video Engine 🎬
Choose dynamically between **Google Veo 2**, **RunwayML Gen-2 / Gen-3 Alpha**, and **Fal.ai Luma Dream Machine** inside a unified motion panel with provider-specific drop-down selectors.

### 6. Architectural Focus 🏛
Preset with architectural variables (golden hour, overcast detailing, biophilic timber, concrete brutalist, and terracotta focuses) built into a professional prompt-builder shell supporting dual Structure and Style reference uploads.

---

## 🛠 Tech Stack

- **UI & Layout:** React 19, Tailwind CSS v4, dynamic CSS theme variables.
- **Core State Engine:** Zustand v5 (with localStorage persistence).
- **GPU Canvas Editor:** Fabric.js 7.x (brush tracking and box scaling).
- **Decentralized History:** IndexedDB (via the lightweight `idb` library).
- **API Key Protection:** Browser Web Crypto API (AES-256-GCM).

---

## 🚀 Instant Launch

No cloning or local configuration is needed. VFX Studio is a 100% static, client-side browser application. You can load and use the generative lab instantly in any browser:

👉 **[Open VFX.STUDIO in Your Browser](https://unrealumanga.github.io/vfx-studio/)**

*(For best results on mobile, save the link to your smartphone home screen as a Web App).*

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<!-- 
SEO Tags (Hidden from human readers, fully indexable by search engines):
vfx-studio, creative-tech, generative-ai, archviz, fabricjs, react-ai, google-imagen, veo2, veo3, dalle3, replicate-flux, prompt-engineering, aes-256-gcm, client-side-inference, web-vfx, unreal-engine, sovereign-ai, byok, runway, luma-dream-machine, gen-2, gen-3-alpha, kling-1.6, inpaint, outpaint
-->
