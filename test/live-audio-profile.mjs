import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import bsc from 'brighterscript';

const source = await readFile('source/utils/deviceCapabilities.bs', 'utf8');
const names = ['getTranscodingProfiles', 'canDecodeVideoAudio'];
const functions = names.map(name => {
    const match = source.match(new RegExp('^function ' + name + '\\([^]*?^end function', 'm'));
    assert.ok(match, name);
    return match[0].replaceAll('CreateObject("roDeviceInfo")', 'm.fakeDevice');
}).join('\n');
const directory = await mkdtemp(path.join(tmpdir(), 'roku-live-profile-'));
try {
    const program = new bsc.Program({ rootDir: directory });
    const input = path.join(directory, 'test.bs');
    program.setFile({ src: input, dest: 'source/test.bs' }, `
namespace string
    const EMPTY = ""
end namespace
function isStringEqual(a, b)
    return a = b
end function
${functions}
sub Main()
    m.global = { session: { user: { settings: {
        "playback.resolution.max": "off", "playback.preferredAudioCodec": "auto",
        "playback.compatibility.disablehevc": false
    } } } }
    m.fakeDevice = {
        GetAudioOutputChannel: function()
            return "Stereo"
        end function,
        CanDecodeVideo: function(format)
            return {Result: true}
        end function,
        CanDecodeAudio: function(format)
            return {Result: format.Codec = "aac" and format.ChCnt = 2}
        end function
    }
    found = 0
    for each entry in getTranscodingProfiles()
        if entry.Type = "Video" and entry.Context = "Streaming"
            if entry.AudioCodec.Instr("aac") < 0 then stop
            found++
        end if
    end for
    if found <> 2 then stop
    m.fakeDevice.CanDecodeAudio = function(format)
        return {Result: false}
    end function
    for each entry in getTranscodingProfiles()
        if entry.Type = "Video" and entry.AudioCodec.Instr("aac") >= 0 then stop
    end for
    print "LIVE AUDIO PROFILE PASSED"
end sub
`);
    const output = path.join(directory, 'test.brs');
    await writeFile(output, (await program.getTranspiledFileContents(input)).code);
    const result = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', output], { encoding: 'utf8' });
    assert.ok(result.includes('LIVE AUDIO PROFILE PASSED'), result);
    console.log(result.trim());
} finally {
    await rm(directory, { recursive: true, force: true });
}
