import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import bsc from 'brighterscript';

const guide = await readFile('components/liveTv/guide/LiveTvGuide.bs', 'utf8');
const keyboard = await readFile('components/keyboards/TVKeyboard.bs', 'utf8');
const audio = await readFile('source/utils/deviceCapabilities.bs', 'utf8');
const player = await readFile('components/video/VideoPlayerView.bs', 'utf8');
const dialog = await readFile('components/liveTv/guide/LiveTvGuideDialog.bs', 'utf8');
function extract(source, name) {
    const match = source.match(new RegExp(`^(?:sub|function) ${name}\\([^]*?^end (?:sub|function)`, 'm'));
    assert.ok(match, name);
    return match[0].replace('name.StartsWith("pcm")', 'Left(name, 3) = "pcm"');
}
const dir = await mkdtemp(path.join(tmpdir(), 'spesh-guide-modal-'));
try {
    const program = new bsc.Program({rootDir:dir});
    const input = path.join(dir, 'test.bs');
    program.setFile({src:input, dest:'source/test.bs'}, `
${extract(guide, 'reactToStore')}
${extract(guide, 'OnScreenShown')}
${extract(guide, 'returnToChannelRow')}
${extract(guide, 'lineupIndexOf')}
${extract(guide, 'cancelChannelHold')}
${extract(guide, 'onChannelHeld')}
${extract(guide, 'onKeyEvent').replace('function onKeyEvent(', 'function guideKeyEvent(').replace(/KeyCode\.(\w+)/g, (_, key) => `"${key.toLowerCase()}"`)}
${extract(dialog, 'onKeyEvent').replace('function onKeyEvent(', 'function dialogKeyEvent(').replace(/KeyCode\.(\w+)/g, (_, key) => `"${key.toLowerCase()}"`)}
${extract(guide, 'handleChannelKey').replace(/KeyCode\.(\w+)/g, (_, key) => `"${key.toLowerCase()}"`)}
${extract(keyboard, 'currentLayout')}
${extract(keyboard, 'insertText')}
${extract(player, 'restorePreviewInput')}
${['transcodableAudioCodecOf','keptAudioCodecs','applyTranscodeAudioCodecs'].map(n=>extract(audio,n)).join('\n')}
function isValid(value)
    return value <> invalid
end function
function isValidAndNotEmpty(value)
    return value <> invalid and value <> ""
end function
sub focusChannelRow(index)
    m.returnedRow = index
end sub
sub watchChannel(id)
    m.watched = id
end sub
sub openChannelMenu(id, held)
    m.openedMenu = id
    m.menuHeld = held
end sub
function pageDirection(key)
    return 0
end function
sub onNavigationKey()
end sub
sub focusWindowBar(index)
    m.toolbarTarget = index
end sub
function toString(value)
    if value = invalid then return ""
    return value
end function
function inArray(items, value)
    for each item in items
        if item = value then return true
    end for
    return false
end function
sub Main()
    m.channelHoldTimer = {control:"start"}
    m.channelHoldId = "test-channel"
    m.dialog = invalid
    m.speshKeyboard = invalid
    m.area = "grid"
    m.gridOnChannel = true
    if not guideKeyEvent("ok",true) then stop
    if m.watched <> invalid then stop
    if not guideKeyEvent("ok",false) then stop
    if m.watched <> "test-channel" or m.channelHoldId <> "" then stop
    m.watched = invalid
    m.channelHoldId = "held-channel"
    onChannelHeld()
    if m.openedMenu <> "held-channel" or not m.menuHeld then stop
    if m.watched <> invalid or m.channelHoldId <> "" then stop
    m.top = {waitForOkRelease:true}
    if not dialogKeyEvent("ok",true) then stop
    if not m.top.waitForOkRelease then stop
    if not dialogKeyEvent("ok",false) then stop
    if m.top.waitForOkRelease then stop
    m.lineup = [{Id:"a"},{Id:"b"},{Id:"c"}]
    m.focusRef = {channelId:"c"}
    m.gridRow = 2
    returnToChannelRow()
    if m.returnedRow <> 2 then stop
    m.lineup = [{Id:"c"},{Id:"a"}]
    returnToChannelRow()
    if m.returnedRow <> 0 then stop
    m.lineup = [{Id:"a"},{Id:"b"}]
    returnToChannelRow()
    if m.returnedRow <> 1 then stop
    m.lineup = []
    m.returnedRow = -1
    returnToChannelRow()
    if m.returnedRow <> -1 then stop
    m.view = invalid
    if not handleChannelKey("left", 200) then stop
    if m.toolbarTarget <> 6 then stop
    m.view = {}
    if not handleChannelKey("left", 200) then stop
    if m.toolbarTarget <> 11 then stop
    m.store = {state:"ready"}
    m.speshKeyboard = {setFocus:sub(value)
        m.focused = value
    end sub}
    m.dialog = invalid
    reactToStore()
    OnScreenShown(true)
    if m.speshKeyboard.focused <> true then stop
    m.speshKeyboard = invalid
    m.dialog = {}
    reactToStore()
    m.top = {purpose:"channelNumber"}
    m.field = {text:"",cursorPosition:0}
    layout = currentLayout()
    if layout.Count() <> 4 or layout[0][0] <> "1" or layout[3][2] <> "DONE" then stop
    insertText("100")
    if m.field.text <> "100" then stop
    insertText("a")
    if m.field.text <> "100" then stop
    profile = {DirectPlayProfiles:[],TranscodingProfiles:[{Type:"Video",Context:"Streaming",Container:"ts",AudioCodec:"aac,ac3,mp3"}]}
    converted = applyTranscodeAudioCodecs(profile,["aac"],false)
    if converted.TranscodingProfiles[0].AudioCodec <> "ac3,mp3" then stop
    modal = {visible:true,setFocus:sub(value)
        m.focused = value
    end sub}
    scene = {dialog:invalid,keyboard:modal,findNode:function(id)
        return m.keyboard
    end function}
    m.top = {scene:scene,getScene:function()
        return m.scene
    end function}
    restorePreviewInput()
    if modal.focused <> true then stop
    modal.focused = false
    scene.dialog = modal
    restorePreviewInput()
    if modal.focused <> true then stop
    print "GUIDE MODAL AND AUDIO REGRESSIONS PASSED"
end sub
`);
    const output = path.join(dir,'test.brs');
    await writeFile(output,(await program.getTranspiledFileContents(input)).code);
    const result=execFileSync(process.execPath,['node_modules/brs/bin/cli.js',output],{encoding:'utf8'});
    assert.ok(result.includes('GUIDE MODAL AND AUDIO REGRESSIONS PASSED'),result);
    console.log(result.trim());
} finally {await rm(dir,{recursive:true,force:true});}
