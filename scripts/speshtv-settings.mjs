import { readFile, writeFile } from 'node:fs/promises';
const path = 'settings/settings.json';
const settings = JSON.parse(await readFile(path, 'utf8'));
function update(items) {
    for (const item of items) {
        // Keep original-author support labels accurate.
        if (item.title && !/Support Moonfin/.test(item.title)) {
            item.title = item.title.replace(/Moonfin/g, 'SpeshTV');
        }
        if (item.settingName === 'colorBackground') item.default = '#121416';
        if (item.settingName === 'colorCursor') item.default = '#56D9CC';
        if (item.options) update(item.options);
        if (item.children) update(item.children);
    }
}
update(settings);
await writeFile(path, JSON.stringify(settings, null, 2) + '\n');
