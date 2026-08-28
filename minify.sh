#!/usr/bin/env bash
# =============================================
# DevFlow Suite — Minification Script
# Run: bash minify.sh
# Requires: terser (npm i -g terser) or node
# =============================================

set -euo pipefail

DIST_DIR="dist"
SRC_JS=("js/db.js" "js/app.js" "js/templates.js" "js/tools.js" "js/checkout.js")
SRC_CSS="css/styles.css"

echo "🔧 DevFlow Suite — Minification"
echo "================================"

# Create dist directory
mkdir -p "$DIST_DIR/js" "$DIST_DIR/css"

# --- Minify JS ---
echo ""
echo "📦 Minifying JavaScript..."

for src in "${SRC_JS[@]}"; do
  filename=$(basename "$src")
  dest="$DIST_DIR/js/$filename"

  if command -v terser &>/dev/null; then
    terser "$src" \
      --compress drop_console,drop_debugger,passes=3 \
      --mangle toplevel \
      --output "$dest"
    echo "  ✓ $src → $dest (terser)"
  elif command -v node &>/dev/null; then
    # Fallback: Node-based minification (strip comments + compress whitespace)
    node -e "
      const fs = require('fs');
      let code = fs.readFileSync('$src', 'utf8');
      // Remove block comments (but not URLs)
      code = code.replace(/\/\*(?![\s\S]*?https?:\/\/)[\s\S]*?\*\//g, '');
      // Remove line comments (but not URLs)
      code = code.replace(/\/\/(?![\s\S]*?https?:\/\/).*$/gm, '');
      // Collapse multiple newlines
      code = code.replace(/\n{3,}/g, '\n\n');
      // Remove leading/trailing whitespace per line (preserve some structure)
      code = code.split('\n').map(l => l.trim()).filter((l,i,a) => !(l === '' && a[i-1] === '')).join('\n');
      fs.writeFileSync('$dest', code);
    "
    echo "  ✓ $src → $dest (node fallback)"
  else
    cp "$src" "$dest"
    echo "  ⚠ $src → $dest (copied, no minifier available)"
  fi
done

# --- Minify CSS ---
echo ""
echo "🎨 Minifying CSS..."

if command -v csso &>/dev/null; then
  csso "$SRC_CSS" --output "$DIST_DIR/$SRC_CSS" --input-source-map
  echo "  ✓ $SRC_CSS → $DIST_DIR/$SRC_CSS (csso)"
elif command -v node &>/dev/null; then
  node -e "
    const fs = require('fs');
    let css = fs.readFileSync('$SRC_CSS', 'utf8');
    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    // Collapse whitespace
    css = css.replace(/\s{2,}/g, ' ');
    // Remove spaces around selectors/properties
    css = css.replace(/\s*([{}:;,>+~])\s*/g, '\$1');
    // Remove trailing semicolons before closing braces
    css = css.replace(/;}/g, '}');
    // Remove leading/trailing whitespace
    css = css.trim();
    fs.writeFileSync('$DIST_DIR/$SRC_CSS', css);
  "
  echo "  ✓ $SRC_CSS → $DIST_DIR/$SRC_CSS (node fallback)"
else
  cp "$SRC_CSS" "$DIST_DIR/$SRC_CSS"
  echo "  ⚠ $SRC_CSS → $DIST_DIR/$SRC_CSS (copied, no minifier available)"
fi

# --- Copy HTML (no minification needed) ---
echo ""
echo "📄 Copying HTML..."
cp index.html "$DIST_DIR/"
cp offline.html "$DIST_DIR/" 2>/dev/null || true
cp manifest.json "$DIST_DIR/" 2>/dev/null || true
cp sw.js "$DIST_DIR/"
cp robots.txt "$DIST_DIR/" 2>/dev/null || true
cp sitemap.xml "$DIST_DIR/" 2>/dev/null || true
echo "  ✓ HTML + assets copied to $DIST_DIR/"

# --- Summary ---
echo ""
echo "================================"
echo "✅ Done! Files in $DIST_DIR/"

# Show file sizes
echo ""
echo "📊 File sizes:"
for f in "$DIST_DIR/js/"*.js "$DIST_DIR/$SRC_CSS"; do
  if [ -f "$f" ]; then
    size=$(wc -c < "$f")
    orig_size=$(wc -c < "$(echo $f | sed "s|$DIST_DIR/||")" 2>/dev/null || echo "0")
    if [ "$orig_size" -gt 0 ] 2>/dev/null; then
      savings=$((100 - (size * 100 / orig_size)))
      echo "  $(basename $f): ${size}B (was ${orig_size}B, -${savings}%)"
    else
      echo "  $(basename $f): ${size}B"
    fi
  fi
done
