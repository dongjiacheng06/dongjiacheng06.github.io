# Code Agent Guide

This file is for code agents that need to maintain or extend the project page in this repository.

## Scope

This repository is a static academic project page for the MeMix paper.

Current entry points:

- `index.html`
- `static/css/index.css`
- `static/js/nav.js`

Primary asset folders:

- `static/images/`
- `static/models/`

## Current page structure

The current page is organized as:

1. Hero
2. Abstract
3. Overview of MeMix
4. Interactive Examples
5. Experiments
6. BibTeX

When editing, preserve the overall academic-project-page tone. Avoid turning the site into a product landing page.

## Design constraints

- Keep the visual style academic and restrained.
- Keep the current white, Nerfies-like academic style unless explicitly asked to change it.
- Prefer centered title/author/resource layout in the hero.
- Do not add placeholder text like `Coming Soon`, `NaN`, `TODO`, or fake author names.
- If a visual is not ready, use a clear placeholder block only when the user explicitly wants one.

## Asset organization

Root-level assets should be normalized and moved into `static/`.

Use these conventions:

- Main transparent logo: `static/images/logo.png`
- Original raster logo backup: `static/images/original-logo.jpg`
- Favicon: `static/images/favicon-32.png`
- Apple touch icon: `static/images/apple-touch-icon.png`
- Raw GLB scenes: `static/models/raw/*.glb`
- Browser-ready GLB scenes: `static/models/*.glb`

Do not expose source PDFs on the public site unless the user explicitly asks for PDF downloads again.
If new PDFs are dropped into the root directory, treat them as private source assets by default. Generate derived images from them if needed, but do not link them from the webpage.
If new 3D scenes are dropped into the root directory, move them into `static/models/raw/` before processing.

## Image generation workflow

### 1. Cropped PDF previews

If a private source PDF was cropped in Acrobat or contains a `CropBox`, generate the page preview using the crop box:

```bash
pdftoppm -png -singlefile -cropbox -r 280 /path/to/source.pdf /tmp/output-prefix
```

Use this for sheet previews that should display exactly as cropped in the browser.

### 2. Transparent pipeline preview

If the private source PDF has no solid page background and you want the web preview without a white rectangle, use `pdftocairo` with transparent output:

```bash
pdftocairo -png -singlefile -transp /path/to/source.pdf /tmp/output-prefix
```

This only affects the preview PNG used on the webpage.

### 3. Favicon and touch icon generation

If the logo is replaced, regenerate icon assets:

```bash
sips --resampleHeightWidth 32 32 static/images/logo.png --out static/images/favicon-32.png
sips --resampleHeightWidth 180 180 static/images/logo.png --out static/images/apple-touch-icon.png
```

## Title handling

The hero title is intentionally fixed to three lines.

Current format:

```text
MeMix:
Writing Less, Remembering More for
Streaming 3D Reconstruction
```

Implementation notes:

- `index.html` uses separate spans for fixed line breaks.
- `static/css/index.css` keeps each line as `display: block` with `white-space: nowrap`.
- Keep the title centered.

Do not revert this back to automatic wrapping unless the user explicitly asks.

## Abstract policy

The abstract should be copied from the paper text, not paraphrased, unless the user asks for rewriting.

If the paper changes:

1. Extract the abstract from the updated PDF.
2. Replace the abstract section in `index.html`.
3. Keep the citation and title synchronized with the paper.

## Pipeline and demos policy

- The `Pipeline` section should show the standalone pipeline figure only.
- The `Overview of MeMix` caption under the pipeline image now uses KaTeX auto-render; keep formula text in LaTeX form inside the `figcaption.katex-caption`.
- Do not mix the pipeline figure with demo sheet previews unless explicitly requested.
- The `3R Interactive Demo` section currently uses two side-by-side WebGL canvases for `o. MeMix` and `w. MeMix`.
- Camera interaction is synchronized in `static/js/demo-viewer.js` with about `100ms` delay.
- The active viewer also supports `W/A/S/D` panning, mapped through OrbitControls' keyboard pan handling.
- Hovering or clicking a viewer panel makes that panel the active keyboard-control target.
- The scene header explicitly states the active pair name, view count, and the `1200` points-per-frame cap.

If new GLB scenes are added later:

1. Put the raw files in `static/models/raw/`.
2. Downsample them with `tools/downsample_glb_points.py`.
3. Export browser-ready files to `static/models/`.
4. Update the left/right viewer sources in `#demos`.
5. Keep both viewer containers in the same sync group via `data-demo-sync-group`.

### Current web 3D setup

The current MeMix page still does not use CUT3R's Viser playback system.

Instead, it now uses a dedicated Three.js-based dual-viewer implementation for `.glb` files:

- Script source in `index.html`:

```html
<script>
// Under file://, do not load the module script.
// Show a clear HTTP-server warning instead.
</script>
```

- Viewer containers in `#demos`:

```html
<div class="demo-model-viewer" data-demo-webgl="viewer" data-demo-panel="left"></div>
<div class="demo-model-viewer" data-demo-webgl="viewer" data-demo-panel="right"></div>
```

- Scene buttons live below the viewers and use `data-demo-scene="..."`.
- Scene button thumbnails are filled from local images under `static/images/examples/`.
- The active scene list is defined in `static/js/demo-viewer.js`, not inline in HTML.

- `static/js/demo-viewer.js` imports local vendor files:
  - `./vendor/three.module.js`
  - `three.module.js` also depends on `./vendor/three.core.js`
  - `./vendor/GLTFLoader.js`
  - `./vendor/OrbitControls.js`
  - `GLTFLoader.js` also depends on `./vendor/BufferGeometryUtils.js`
- `index.html` only injects `demo-viewer.js` dynamically when the page is served over `http://` or `https://`.
- It renders the two GLBs side by side, switches scenes from the button row, and synchronizes orbit controls with about `100ms` delay plus a smooth follow transition.
- It explicitly adjusts point rendering so point-cloud-heavy GLBs are actually visible.
- Do not force recolor small frustum meshes unless the user explicitly asks for it.
- `static/js/nav.js` no longer handles the 3D demo logic; it only handles experiment table tabs.
- If local preview looks blank, serve the page over HTTP rather than opening `index.html` directly via `file://`.

### What was done in this repo

The current interactive section was built with these concrete steps:

1. The original placeholder demo layout in `#demos` was removed.
2. A `model-viewer` attempt was added first, but it was not reliable for the current point-cloud GLBs.
3. The final version replaced `model-viewer` with a custom Three.js dual-viewer in `static/js/demo-viewer.js`.
4. Two side-by-side WebGL canvases were added for `o.MeMix` and `w.MeMix`.
5. Camera synchronization was moved into the dedicated Three.js viewer script and changed to buffered smooth following.
6. The needed Three.js files were vendored locally into `static/js/vendor/`.
7. `BufferGeometryUtils.js` also had to be vendored locally because `GLTFLoader` imports it.
8. The original single-scene `o-memix.glb` / `w-memix.glb` pair was retired.
9. The active scene pairs now live under `static/models/examples/`.
10. Scene switching is driven by named entries in the `SCENES` array inside `static/js/demo-viewer.js`.

### Why the model could appear blank

There are two common failure cases here:

1. The page is opened directly with `file://` instead of being served over HTTP.
2. The page is still referencing external viewer code instead of the vendored local files.
3. `GLTFLoader` is missing its local `BufferGeometryUtils.js` dependency, so the module graph fails before rendering starts.
4. The point cloud is technically loaded, but the renderer is not sizing or styling points appropriately.

### Local preview command

Use an HTTP server from the repo root:

```bash
cd /Users/apple/Documents/Projects/MoM3R/MoM3R.github.io
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Do not judge the 3D viewer from a `file://.../index.html` preview.

### Downsampling GLB point clouds for the web

The current interactive examples use the smaller `.glb` files under `static/models/examples/`.
If a future model bundle is too heavy for direct browser rendering, use the helper script like this:

```bash
python3 tools/downsample_glb_points.py INPUT.glb OUTPUT.glb --target-points 200000
```

What the script does:

- finds the `POINTS` primitive in the GLB
- downsamples the point cloud to the target count
- repacks all bufferViews to remove exporter padding gaps
- writes a much smaller browser-ready `.glb`

The older prototype pair in this repo was reduced from about `216 MB` to about `3.3 MB` using this script before it was retired.

### Important note about the current source GLBs

At the time this guide was updated:

- `static/models/raw/cut_last_even.glb`
- `static/models/raw/mom_last_even.glb`

had the same SHA-1 hash, meaning they were byte-identical files.

This means the left/right demo infrastructure is in place, but the current two scenes do not yet show a true geometric before/after comparison.

To verify this again later:

```bash
shasum static/models/raw/cut_last_even.glb static/models/raw/mom_last_even.glb
```

If the hashes match, the visual content is still identical.

## Experiments section

The experiments section uses tab-like buttons above the tables.

Files involved:

- `index.html`
- `static/css/index.css`
- `static/js/nav.js`

Implementation rules:

- Buttons use `.experiment-tab`.
- Panels use `.experiment-panel`.
- The active panel is matched through `data-panel`.
- `static/js/nav.js` handles activation and hiding.

If you add a new experiment table:

1. Add a new button with `data-panel="..."`.
2. Add a new `.experiment-panel` article with the same `data-panel`.
3. Keep non-default panels `hidden`.

Do not reintroduce stacked always-visible tables unless explicitly requested.

## Tables

The current experiment tabs are a curated subset of the paper tables, not a full one-to-one reproduction.

When updating:

- Prefer exact values from the paper or already-transcribed repository tables.
- The default tabs are `Table 2`, `Table 4`, `Table 5`, `Table 6`, and `Table 7`.
- `Table 2` and `Table 5` are currently reduced to 300-view 7-Scenes slices.
- `Table 6` and `Table 7` are currently reduced to representative metrics with clearer MeMix gains.
- Use `.metric-better-cell` when a `w. MeMix` cell is better than the corresponding backbone.
- Keep the note above the tabs that explains green cells and points readers to the paper for full tables.
- Avoid embedding PDF screenshots if the user asked for HTML tables.

## Interactive 3D models: how CUT3R does it

CUT3R's interaction is not implemented as an inline Three.js scene written from scratch in the project page.

Instead, it uses a hosted Viser web client and playback recordings.

Based on the CUT3R website and source:

- Project page: `https://cut3r.github.io/`
- Source repo: `https://github.com/CUT3R/CUT3R.github.io`
- Viser docs: `https://viser.studio/main/embedded_visualizations/`

### Core idea

CUT3R stores interactive scenes as `.viser` playback files and loads them through a prebuilt web viewer under `/build/`.

Their `interactive.js` constructs iframe URLs like:

```text
/build/?playbackPath=/recordings/example.viser
```

They also add optional query parameters such as:

- `synchronizedVideoOverlay=/recordings/example.mp4`
- `synchronizedVideoTimeOffset=0.0`
- `initialCameraPosition=...`
- `initialCameraLookAt=...`
- `baseSpeed=0.5`
- `darkMode`

Then they inject that URL into an `<iframe>`.

### What this means in practice

CUT3R's interactive 3D result system is roughly:

1. Export or record a Viser scene to a `.viser` file.
2. Host the Viser web client build in a folder like `/build/`.
3. Host the `.viser` recording in a folder like `/recordings/`.
4. Optionally host a synced video overlay in `/recordings/*.mp4`.
5. Embed the viewer in an iframe:

```html
<iframe src="/build/?playbackPath=/recordings/example.viser"></iframe>
```

6. Use JavaScript to swap iframe URLs when the user clicks thumbnails or selectors.

### Why this is useful

This approach is much easier to maintain than building a custom Three.js viewer for every paper page:

- the heavy 3D interaction is delegated to the Viser client
- the page only manages iframe selection and layout
- synchronized video overlays can be added via URL params
- initial camera pose can be tuned without rebuilding the site

### If you want to port this idea into MeMix later

You would need:

1. A Viser-exported web client build directory.
2. One or more `.viser` playback files.
3. Optional synchronized videos.
4. A section in `index.html` with iframe containers and selectors.
5. A small JS file that swaps iframe `src` values based on the chosen scene.

The current MeMix page does not yet include this system.

## Safe editing checklist

After edits:

1. Confirm all PDF and image references still exist.
2. Search for placeholder leftovers:

```bash
rg -n "NaN|Coming Soon|TODO|placeholder|Author A" index.html static/css/index.css static/js/nav.js
```

3. Confirm root-level assets are not left unorganized.
4. Verify any newly generated preview image uses the intended crop or transparency settings.

## Suggested commands

List project assets:

```bash
find . -maxdepth 3 -type f | sort
```

If temporary source PDFs are present locally, use:

```bash
pdfinfo -box /path/to/source.pdf
pdftoppm -png -singlefile -cropbox -r 280 /path/to/source.pdf /tmp/output-prefix
pdftocairo -png -singlefile -transp /path/to/source.pdf /tmp/output-prefix
```

## Source references for CUT3R interactive 3D notes

- CUT3R project page: https://cut3r.github.io/
- CUT3R project page repo: https://github.com/CUT3R/CUT3R.github.io
- CUT3R interactive loader source: `interactive.js` in that repo
- Viser embedded visualization docs: https://viser.studio/main/embedded_visualizations/
