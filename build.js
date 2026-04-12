/**
 * Zobuddy Build Script
 * Compiles src/app.jsx (JSX) into a production index.html with pre-compiled JavaScript.
 * Uses TypeScript compiler for JSX transformation.
 * 
 * Run: node build.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Compile JSX to plain JavaScript using TypeScript compiler
console.log('Compiling JSX with TypeScript...');
try {
  execSync('tsc --jsx react --target ES2020 --module ES2020 --allowJs --outDir tmp_out --skipLibCheck --noEmit false --ignoreConfig src/app.jsx', {
    cwd: __dirname,
    stdio: 'pipe'
  });
} catch (err) {
  console.error('TypeScript compilation failed!');
  console.error(err.stderr?.toString() || err.message);
  process.exit(1);
}

const result = { code: fs.readFileSync(path.join(__dirname, 'tmp_out', 'app.js'), 'utf-8') };
console.log(`Compiled successfully (${result.code.length} bytes)`);

// Clean up tmp_out
fs.rmSync(path.join(__dirname, 'tmp_out'), { recursive: true, force: true });

// Build the final index.html — same structure, but with compiled JS instead of JSX+Babel
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <script>if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(regs=>{regs.forEach(r=>r.update());});}</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Zobuddy">
  <meta name="theme-color" content="#0a0a1a">
  <meta name="mobile-web-app-capable" content="yes">
  <title>Zobuddy</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>">
  <link rel="manifest" href="manifest.json">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>*{margin:0;padding:0;box-sizing:border-box}html,body,#root{height:100%;width:100%;overflow:hidden}body{background:#0a0a1a;font-family:'Nunito','Segoe UI',sans-serif}</style>
</head>
<body>
  <div id="root"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script>
${result.code}
  </script>
  <script>if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});</script>
</body>
</html>`;

// Write output
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

fs.writeFileSync(path.join(distDir, 'index.html'), html);

// Copy static assets from repo root to dist
const assets = ['sw.js', 'manifest.json', 'icon-192.png', 'icon-512.png', '_headers.txt', 'LICENSE'];
assets.forEach(file => {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
    console.log(`  Copied ${file}`);
  }
});

console.log('Build complete! Output in dist/');
console.log(`  index.html: ${(html.length / 1024).toFixed(1)} KB`);
