# SemanticSlider3D — project page

Static academic project page for [SemanticSlider3D](https://github.com/ruw001/SemanticSlider3D).
No build step, no dependencies: plain HTML/CSS/JS, deployable straight to GitHub Pages.

```
index.html                       # all page content — edit this
static/css/style.css             # styling (light + dark, responsive)
static/js/main.js                # frame-sequence sliders + copy-BibTeX
static/images/                   # teaser.png (rendered), edit_process.pdf (vector source)
static/images/sliders_demo/       # 6 demos x 9 attribute steps x 18 views
static/pdfs/                     # paper.pdf
```

## Theming

The accent is two CSS custom properties, defined once per theme at the top of
`static/css/style.css`, and everything else derives from them — the title gradient,
the primary button, slider tracks, method step numbers, and links:

```css
:root { --accent: #0e7490; --accent-2: #1d4ed8; --on-accent: #ffffff; }  /* teal -> blue */
@media (prefers-color-scheme: dark) {
  :root { --accent: #22d3ee; --accent-2: #60a5fa; --on-accent: #08131a; }
}
```

`--on-accent` is the text colour used on top of an accent fill. It must flip with the
theme: the dark-mode accents are light, so white text on them fails contrast. Change the
palette by editing these six values and nothing else.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Fill in the content

Everything to change is marked `TODO` in `index.html`:

```bash
grep -n TODO index.html
```

| What | Where | Status |
| --- | --- | --- |
| Title, subtitle, venue | `<header class="hero">` | done — matches arXiv:2608.18560 |
| Authors + affiliations | `<ul class="authors">`, `.affil` | done |
| Paper / arXiv links | `.links` buttons | done — points at arXiv |
| Abstract | `#abstract` | done — verbatim from the paper |
| Method | `#method` | done — the paper's three stages |
| Evaluation | `#evaluation` | done — validation + study figures |
| BibTeX | `#bibtex` | done — verbatim from arXiv |
| Teaser figure | `static/images/teaser.png` | done — rendered from `edit_process.pdf` |

| Video | `#video` | done — YouTube embed (`ngadxEGPrfw`) |
| Slider frames | `static/images/sliders_demo/` | done — 6 real demos |
| Social preview URL | `og:url` meta tag | **todo** — needs final URL |
| Social preview image | `og:image` | using the video thumbnail until `teaser.png` exists |
| Funding / thanks | `#ack` | **todo** |

Image and video slots that have no file yet render a dashed "drop it here" placeholder
instead of a broken icon, so the page looks intentional while you're still filling it in.

### Interactive sliders

`static/images/sliders_demo/` holds one folder per demo, each with 9 attribute steps
(`0`-`8`) and 18 viewpoints per step (`view_000.png` .. `view_340.png`, every 20 degrees):

```
sliders_demo/23_b/0/view_000.png    # attribute step 0, 0 degrees
sliders_demo/23_b/8/view_340.png    # attribute step 8, 340 degrees
```

To add a demo, drop in a folder of the same shape and add a panel to `.slider-grid` in
`index.html` with `data-demo="<folder>"`. The per-panel slider maps to the attribute step;
the single `#rot` control drives the viewpoint of every panel at once.

**Label convention.** Attribute names are not derivable from the data (folder names carry no
semantics), so each panel's labels are hand-written to a fixed pattern:

| Element | Holds | Example |
| --- | --- | --- |
| `.panel-name` | object, then the attribute **category** | `Phone · condition` |
| `.slider-end` x2 | the two **extremes**, as adjectives or nouns | `clean` / `dirty` |
| `img[alt]` | object + category + both extremes | see below |
| `input[aria-label]` | category + both extremes + object | `condition, clean to dirty, for Phone` |

The last two exist only for screen readers, so they are easy to forget
when retitling a panel. They must be kept in sync with the visible labels — a panel whose alt
text describes a different attribute than its caption is worse than no alt text at all.

**Orientation fixes.** Some variations were generated facing a different way from the rest
of their demo, so their `view_XXX.png` numbering is rotated relative to the others. The
`ORIENTATION_FIX` table in `static/js/main.js` adds a per-variation angle (mod 360) when
resolving a frame, keeping every panel pointing the same way as the rotation slider moves:

```js
var ORIENTATION_FIX = {
  '21_b': sameOffset(180, [1,2,3,4,5,6,7,8]),
  '28_b': { 2: 280, 3: 280, 4: 80, 5: 80, 6: 80 }
};
```

Offsets are keyed by attribute step, since one angle per demo is not always enough. Steps not
listed get no offset. Values are snapped to a multiple of 20 degrees when resolving, so an
offset that is not a rendered angle cannot 404.

To check a demo's alignment, render every step at `view_000.png` side by side and look for the
ones facing differently:

```bash
cd static/images/sliders_demo
for a in 0 1 2 3 4 5 6 7 8; do cp "28_b/$a/view_000.png" "/tmp/x_$a.png"; done
```

**Cache versions.** When you edit CSS or JS, bump the `?v=` query on **both** `style.css`
and `main.js` in `index.html`. Both are cached aggressively: a stale `main.js` against fresh
HTML renders blank panels, and a stale `style.css` breaks layout. As a backstop each panel's
`<img>` carries a real `src` for attribute step 0 at 0 degrees, so the first frame shows from
HTML alone even if the JS is stale, blocked, or throws.

**Loading.** The set is 972 images / ~53 MB, so it is never bulk-preloaded. `static/js/main.js`
fetches on demand, holds the current frame on screen until the next has decoded (no flash while
dragging), and warms likely-next frames in the background with at most 4 concurrent requests.
Only 6 images (~330 KB) are needed for first paint. Prefetch is skipped entirely when the
browser reports `saveData` or a 2G connection.

If page weight becomes a concern, converting the PNGs to WebP typically saves 60-70%
with no visible difference at this size.

## Publish under its own name

The page is fully relative-path, so it works at any address with no code changes.
Three routes, cheapest first. As of the last check, `semanticslider3d` was free as a
GitHub org and unregistered on .com / .org / .io.

### A. GitHub organization — free, no DNS

Gives `https://semanticslider3d.github.io/` with your username nowhere in the URL.

1. Create the org: <https://github.com/organizations/plan> → pick **Free** → name it `semanticslider3d`.
2. The repo **must** be named exactly `<org>.github.io` for the page to serve at the org root:

```bash
git remote add origin git@github.com:semanticslider3d/semanticslider3d.github.io.git
git push -u origin main
```

3. Pages turns itself on for a `*.github.io` repo. If not: Settings → Pages → `main` / `/ (root)`.

Live at `https://semanticslider3d.github.io/`. No renewal, HTTPS automatic.

### B. Custom domain — ~$12/yr, most citable

1. Buy the domain (Cloudflare Registrar and Namecheap are both fine; `.org` reads well for research).
2. Tell GitHub about it — the `CNAME` file must contain the bare domain, nothing else:

```bash
echo "semanticslider3d.org" > CNAME
git add CNAME && git commit -m "Add custom domain" && git push
```

3. At your DNS provider, for an **apex** domain (`semanticslider3d.org`) add four `A` records:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

For a **subdomain** (`www.` or `page.`) add one `CNAME` record pointing to `<user>.github.io`
instead. Apex + `www` both working means: A records on the apex, `CNAME` on `www`.

4. Settings → Pages → Custom domain → enter it → wait for the DNS check → tick **Enforce HTTPS**
   (the certificate can take up to an hour; the tickbox is greyed out until it is issued).

Verify propagation:

```bash
dig +short semanticslider3d.org
curl -sI https://semanticslider3d.org | head -1
```

### C. Netlify / Vercel — free, no DNS

```bash
npx netlify-cli deploy --prod --dir .     # or: npx vercel --prod
```

Gives `https://semanticslider3d.netlify.app/`. Both also accept a custom domain later.

### Switching routes later

Nothing in the page hardcodes a host. To move, change two things:

- `CNAME` — add it for a custom domain, delete it to go back to a `github.io` address.
- the `og:url` meta tag in `index.html` — set it to the final canonical URL so link previews resolve.

If you move *after* announcing a URL, keep the old address alive: GitHub redirects an old
Pages URL to the new custom domain automatically, but only while the old repo still exists.

## Link it from the code repo

Add the URL to the code repo's About sidebar and to the top of its README, so the two
point at each other.

## Regenerating the teaser from the PDF

`index.html` shows `static/images/teaser.png`, rasterized from the vector source
`static/images/edit_process.pdf` — browsers cannot display a PDF inside an `<img>`.
After editing the PDF, re-render it:

```bash
cd static/images
gs -dNOPAUSE -dBATCH -dQUIET -sDEVICE=png16m -r44 -dFirstPage=1 -dLastPage=1 \
   -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sOutputFile=teaser.png edit_process.pdf
```

`-r44` yields ~2400px wide for a ~3955pt-wide page, i.e. roughly 2x the 1452px display
width for crisp rendering on retina screens. Scale the number if the page size changes.
The figure links to the PDF so readers can zoom the vector original.
