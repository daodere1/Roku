import { writeFile, mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

// The same television outline as Android's speshtv_foreground.xml.
const mark = '<path d="M34,39 L74,39 Q79,39 79,44 L79,68 Q79,73 74,73 L34,73 Q29,73 29,68 L29,44 Q29,39 34,39 Z M44,29 L54,39 L64,29 M44,81 L64,81" fill="none" stroke="#56D9CC" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
async function render(file, width, height, kind) {
    const size = kind === 'icon' || kind === 'logo' ? height * 1.15 : height * 0.36;
    const x = kind === 'icon' ? (width - size) / 2 : kind === 'logo' ? 0 : width * 0.23;
    const y = (height - size) / 2;
    const text = kind === 'icon' ? '' : `<text x="${x + size * 0.92}" y="${height * 0.54}" fill="#F3F5F6" font-family="Segoe UI" font-weight="700" font-size="${height * (kind === 'logo' ? 0.5 : 0.11)}" dominant-baseline="middle">SpeshTV</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#121416"/><g transform="translate(${x},${y}) scale(${size / 108})">${mark}</g>${text}</svg>`;
    await writeFile(file, new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng());
}
for (const [suffix, width, height] of [['fhd', 540, 405], ['hd', 336, 210], ['sd', 246, 140]]) {
    await render(`images/channel-poster_${suffix}.png`, width, height, 'icon');
}
for (const [suffix, width, height] of [['fhd', 1920, 1080], ['hd', 1280, 720], ['sd', 720, 480]]) {
    await render(`images/splash-screen_${suffix}.png`, width, height, 'splash');
}
await render('images/logo.png', 500, 113, 'logo');
await render('images/speshtv-icon.png', 120, 120, 'icon');
await mkdir('images/loading', { recursive: true });
await render('images/loading/speshtv.png', 192, 192, 'icon');
const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 108 108">${mark.replace('#56D9CC', '#FFFFFF')}</svg>`;
await writeFile('images/loading/speshtv-mask.png', new Resvg(mask).render().asPng());
