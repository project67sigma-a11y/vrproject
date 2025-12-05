Godot 4 — Export HTML5 (WebXR) and host on GitHub Pages

Overview
- This project is prepared for HTML5 / WebXR export. The scene is built to run in Godot 4 and uses a simple pointer-based teleportation script that maps to `ui_accept`.

Pre-flight in Godot Editor
1. Install the HTML5 export templates: Editor -> Manage Export Templates -> Install (or via the Godot website).
2. If you plan to use WebXR in the browser, install/enable a WebXR plugin compatible with Godot 4 (community WebXR addons exist). Alternatively, rely on the browser's gamepad/mouse input and simple raycast teleport.
3. Open Project -> Project Settings -> Input Map and ensure `ui_accept` exists (default maps mouse left/enter/gamepad A). For VR controllers you may map the trigger button to `ui_accept`.

Minimal HTML5 export steps
1. In Godot: Project -> Export -> Add -> HTML5. Create an export preset.
2. Configure the HTML5 preset: set the `Index` to `index.html` and tweak canvas size options as needed.
3. Export the project to a folder (for example `export/html5/`). After export you will have `index.html`, `project.wasm`, `project.data`, and/or `.pck` files depending on build.

Hosting on GitHub Pages (quick method using `gh` and `git`)
1. Build/export to a local folder, e.g. `export/html5/`.
2. Create a `gh-pages` branch and push the exported files there. Example (run from workspace root):

```bash
# assume exported files are in export/html5/
mkdir -p /tmp/ghpage
cp -r export/html5/* /tmp/ghpage/
cd /tmp/ghpage
git init
git checkout -b gh-pages
git add .
git commit -m "Publish Godot HTML5 export"
# Replace origin URL with your repo (or push to a new remote)
git remote add origin <YOUR_REPO_GIT_URL>
git push -u origin gh-pages --force
```

3. Alternatively, put the exported files in a `docs/` folder at your repository root and enable GitHub Pages from the `main` branch using the `docs/` folder (Settings -> Pages -> Source -> main/docs). Commit the exported files into `docs/` and push.

Notes and tips
- For WebXR, browsers require HTTPS and a secure context. GitHub Pages provides HTTPS by default.
- If you add a WebXR plugin, follow its specific export instructions; some need extra JS glue or modified index.html.
- Test locally first by opening index.html through a simple local web server (not `file://`):

```bash
cd export/html5
python3 -m http.server 8000
# then open http://localhost:8000 in a WebXR capable browser
```

Troubleshooting
- If input or controllers do not work in the browser, map the trigger/button to `ui_accept` in Project Settings -> Input Map, or configure plugin-specific mappings.
- If performance is poor on mobile VR, reduce texture sizes and polygon count, or enable simpler rendering in Project Settings.

WebXR-specific tips
- Use a Godot WebXR addon compatible with Godot 4 if you need immersive VR controller support. Community plugins usually expose controller transforms and button events which you should map to Godot `Input` actions such as `ui_accept`.
- When using a WebXR plugin, you may need to add small JavaScript glue to `index.html` produced by the Godot HTML5 export. The plugin's README will show the required changes (for example, loading a plugin JS file or calling an init function before starting the Godot runtime).
- If you don't install a WebXR plugin, the experience still runs as a regular HTML5 app: mouse/keyboard and gamepad inputs work, but full WebXR headset support (immersive session) requires the plugin and secure hosting.
- For testing with WebXR on desktop, enable `chrome://flags/#webxr` and use a compatible browser (Chrome/Edge/Firefox Nightly depending on your platform), or use the WebXR emulator / WebXR API Emulator extensions for development.

Export checklist for HTML5 (WebXR-ready)
- Ensure HTML5 export templates are installed in Godot Editor.
- Map controller trigger to `ui_accept` (Input Map) so the teleport script works with VR controller triggers.
- Export with `Export With Debug` disabled for best performance; test with `Debug` enabled first for easier logs.
- After export, open over HTTPS (GitHub Pages) or run a local HTTPS server if testing WebXR locally.

How to enable WebXR support in Godot 4

**Option 1: Use the built-in WebXR support (Godot 4.1+)**
1. Open your project in Godot 4.1 or later.
2. The `export_presets.cfg` file in this repo contains an HTML5 preset with `webxr/enabled=true`. If you don't have this file, create it or use the editor to create an HTML5 export preset.
3. In Godot Editor: Project -> Export -> Manage Export Presets. Select the "HTML5 WebXR" preset and ensure the following:
   - Preset name: "HTML5 WebXR"
   - Platform: Web
   - Export path: `export/html5/index.html`
   - Under "HTML5" options, ensure WebXR is enabled (look for `webxr/enabled` option or check the export_presets.cfg file).
4. Export your project: Project -> Export All or right-click the preset and select "Export". Files will be written to `export/html5/`.

**Option 2: Add a community WebXR plugin (for enhanced features)**
If you need more advanced WebXR features (hand tracking, advanced button mapping, haptics), use a community Godot 4 WebXR addon:
- Search the Godot Asset Library for "WebXR" or check GitHub for community plugins.
- Common plugins: `godot-webxr` or similar (check compatibility with Godot 4).
- Install by copying the plugin to `res://addons/webxr/` and enabling it in Project -> Project Settings -> Plugins.
- The plugin will auto-update input mappings and XRController3D behavior to match WebXR device input.

**Mapping VR controller triggers in Godot Input Map**
For the teleport script to work with VR controllers:
1. Open Project -> Project Settings -> Input Map.
2. Find or create the `ui_accept` action.
3. Add a new device input: 
   - Select `ui_accept` and click "Add Event".
   - Choose "Joypad Button" or "JoypadMotion".
   - For XR controller trigger: use "XR Positional Tracker Button" if available, or "Joypad Button" and set to Button 7 (trigger).
4. Alternatively, if using a WebXR plugin, the plugin may auto-map controller buttons to `ui_accept` or provide its own input events.

**Testing WebXR locally**

Desktop (non-VR) testing:
- Export and serve over HTTP: `python3 -m http.server 8000` in the export folder.
- Open http://localhost:8000 in a WebXR-capable browser (Chrome, Edge, Firefox Nightly).
- The app will run in non-immersive (flat screen) mode.

With VR headset:
- Ensure you are on an HTTPS connection (GitHub Pages or local HTTPS server).
- On a VR headset, open the exported URL in the browser's WebXR-capable browser.
- The teleport script and controller pointers will respond to headset controllers.

**Browser compatibility**
- **Chrome/Edge on Windows**: Full WebXR support (SteamVR, Windows Mixed Reality headsets).
- **Firefox on Linux/Windows**: WebXR support via SteamVR or native implementations.
- **Safari (iOS/macOS)**: Limited WebXR support; use AR capabilities if targeting mobile AR.
- **Android**: Some browsers support WebXR for Cardboard or native Android VR APIs.

**Debugging WebXR in the browser**
1. Open DevTools (F12) in the browser.
2. Check Console for XR initialization messages or errors.
3. If WebXR is not available, you'll see a console warning. Ensure:
   - Browser supports WebXR (check https://caniuse.com/webxr).
   - Page is served over HTTPS (required by the WebXR spec for security).
   - VR hardware is plugged in (for headset testing) or use the WebXR emulator extension.
4. Use the **WebXR API Emulator** browser extension (available for Chrome/Edge/Firefox) to simulate VR input without hardware.

**Godot project settings for WebXR**
If you want to customize XR behavior further, check Project -> Project Settings and look for these XR options:
- `xr/general/startup_tracking_enabled`: Enable/disable automatic XR initialization.
- `rendering/global_illumination/...`: Optimize rendering for mobile VR if needed.

That's it! You should now be able to export, test locally, and deploy to GitHub Pages with WebXR support.
