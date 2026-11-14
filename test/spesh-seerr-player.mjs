import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import bsc from 'brighterscript';
import bslib from '@rokucommunity/bslib';

const folder = await mkdtemp(path.join(tmpdir(), 'spesh-seerr-player-'));
const program = new bsc.Program({ rootDir: folder, sourceMap: false });
try {
    let source = 'namespace bslib\n' + bslib.source + '\nend namespace\n';
    source += await readFile('source/enums/KeyCode.bs', 'utf8');
    const extracts = [
        ['components/home/TrailerPreviewTask.bs', ['trailerFileSize', 'trailerHeaderSize'], 'unused'],
        ['components/data/SceneManager.bs', ['trailerPathExpired', 'onTrailerReturnFocus'], 'unused'],
        ['components/video/VideoPlayerView.bs', ['subtitleDownloadOwnsInput'], 'unused'],
        ['components/seerr/SeerrDiscoveryScreen.bs', ['onKeyEvent'], 'discoveryKey'],
        ['components/seerr/SeerrGenreBrowseScreen.bs', ['onKeyEvent', 'ShowFilterDialog', 'ShowSortDialog'], 'browseKey'],
        ['components/details/TrailerOverlay.bs', ['onKeyEvent', 'onVideoState', 'showTrailerError', 'tryNextTrailer'], 'trailerKey'],
    ];
    for (const [file, names, keyName] of extracts) {
        const code = await readFile(file, 'utf8');
        for (const name of names) {
            const fn = code.match(new RegExp('^(?:sub|function) ' + name + '\\([^]*?^end (?:sub|function)', 'm'))[0];
            source += '\n' + fn.replace('function onKeyEvent(', 'function ' + keyName + '(');
        }
    }
    source += '\nconst TRAILER_SEEK_STEP = 10\n';
    source += await readFile('test/spesh-seerr-player.bs', 'utf8');
    const input = path.join(folder, 'test.bs');
    const file = program.setFile({ src: input, dest: 'source/test.bs' }, source);
    assert.equal(file.getDiagnostics().length, 0, 'Fixture parses');
    const { code } = await program.getTranspiledFileContents(input);
    const output = path.join(folder, 'test.brs');
    await writeFile(output, code);
    const result = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', output], { encoding: 'utf8' });
    assert.ok(result.includes('SPESHTV SEERR FOCUS/PLAYER TESTS PASSED') && !result.includes('FAIL:'), result);
    process.stdout.write(result);
    const action = await readFile('source/MainActions.bs', 'utf8');
    assert.match(action, /callFunc\("pushScene", overlay\)\s+overlay.videoId = choice\.videoId/);
    const task = await readFile('components/home/TrailerPreviewTask.bs', 'utf8');
    assert.ok(task.includes('if preferCompatible then clients = [clients[1], clients[0]]'));
    assert.ok(task.includes('if preferCompatible and stream.format = "mp4" then return stream'));
    const overlay = await readFile('components/details/TrailerOverlay.bs', 'utf8');
    assert.ok(!overlay.includes('CreateObject("roFileSystem")'), 'UI thread never performs filesystem cleanup');
    assert.ok(overlay.includes('m.video.content = invalid'), 'Closing releases the video content');
    assert.ok(overlay.includes('preferCompatible: m.compatibilityFallback'), 'First attempt allows higher-quality manifests');
} finally {
    program.dispose();
    await rm(folder, { recursive: true, force: true });
}
