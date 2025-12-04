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

That's it — export, push to GitHub Pages, and test in a browser. The provided scenes and scripts are intentionally minimal so they are easy to extend.
