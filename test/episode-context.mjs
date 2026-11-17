import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import bsc from 'brighterscript';
const temp=await mkdtemp(path.join(tmpdir(),'roku-hold-'));
try {
 const input=await readFile('components/cinematic/SpeshGridInput.bs','utf8');
 const model=(await readFile('source/utils/speshCinematic.bs','utf8')).replace(/^import.*$/mg,'');
 const menuSource=await readFile('components/itemMenu/ItemContextMenu.bs','utf8');
 const menuKey=menuSource.match(/^function onKeyEvent\([^]*?^end function/m)[0].replace('function onKeyEvent','function onMenuKeyEvent');
 const keys=await readFile('source/enums/KeyCode.bs','utf8');
 const modalSource=await readFile('components/details/SpotlightSectionModal.bs','utf8');
 const scrollGrid=modalSource.match(/^sub scrollGridItem[^]*?^end sub/m)[0];
 const program=new bsc.Program({rootDir:temp});
 const file=path.join(temp,'test.bs');
 program.setFile({src:file,dest:'source/test.bs'},input+model+keys+menuKey+'\n'+scrollGrid+`
sub scrollBodyTo(target)
 m.scrollTarget=target
end sub
sub closeMenu(choice)
 m.closedChoice=choice
end sub
sub markFocus(index)
 m.focusIndex=index
end sub
function toString(value)
 if value=invalid then return ""
 if GetInterface(value,"ifString")<>invalid then return value
 return value.toStr()
end function
sub check(value, expected, label)
 if value<>expected
  print "FAIL: ";label
  stop
 end if
end sub
sub Main()
 m.timer={control:"stop"}
 m.top={held:false,selected:false,requested:false,contextEnabled:true,focused:true,isInFocusChain:function()
  return m.focused
 end function}
 check(onKeyEvent("OK",true),true,"down consumed")
 check(m.top.selected,false,"not selected on down")
 onKeyEvent("OK",true)
 check(m.top.requested,false,"repeat does not request")
 onKeyEvent("OK",false)
 check(m.top.selected,true,"short release selects")
 m.top.selected=false
 onKeyEvent("OK",true)
 onHold()
 check(m.top.requested,true,"hold requests menu")
 onKeyEvent("OK",true)
 onKeyEvent("OK",false)
 check(m.top.selected,false,"held release never plays")
 m.top.requested=false
 onKeyEvent("OK",true)
 onKeyEvent("down",true)
 onHold()
 onKeyEvent("OK",false)
 check(m.top.selected,false,"navigation cancels selection")
 check(m.top.requested,false,"navigation cancels hold")
 onKeyEvent("OK",true)
 m.top.focused=false
 onFocusChanged()
 onHold()
 onKeyEvent("OK",false)
 check(m.top.selected,false,"focus loss cancels selection")
 check(m.top.requested,false,"focus loss cancels hold")
 m.top.focused=true
 onKeyEvent("options",true)
 check(m.top.requested,true,"Star alternative")
 m.top.visible=true
 m.top.waitForSelectRelease=true
 m.targets=[{id:"play"}]
 m.focusIndex=0
 m.confirming=false
 m.closedChoice=""
 onMenuKeyEvent("OK",true)
 check(m.closedChoice,"","held repeat cannot activate menu")
 onMenuKeyEvent("OK",false)
 check(m.top.waitForSelectRelease,false,"release arms menu")
 onMenuKeyEvent("OK",true)
 check(m.closedChoice,"play","fresh OK activates menu")
 episodes=[{json:{Type:"Episode",Id:"a",UserData:{Played:true}}},{json:{Type:"Episode",Id:"b",UserData:{Played:false}}},{json:{Type:"Episode",Id:"c",UserData:{Played:false,PlaybackPositionTicks:900,LastPlayedDate:"2026-11-16"}}}]
 check(speshCinematic.EpisodeAnchor(episodes),2,"resume first")
 check(speshCinematic.EpisodeAnchor(episodes,"b"),1,"selected beats resume")
 episodes[0].currentEpisode=true
 check(speshCinematic.EpisodeAnchor(episodes),0,"current episode")
 episodes[0].currentEpisode=false
 episodes[2].json.UserData.PlaybackPositionTicks=0
 check(speshCinematic.EpisodeAnchor(episodes),1,"first unwatched")
 check(speshCinematic.EpisodeAnchor([]),0,"empty safe")
 window=speshCinematic.GridWindow(170,3,320,30)
 check(window.rows,57,"long season preserves logical rows")
 check(window.visibleRows,2,"long season has bounded native viewport")
 check(window.height,670,"episode viewport fits modal")
 window=speshCinematic.GridWindow(20,6,380,30)
 check(window.visibleRows,1,"portrait rows leave room for heading")
 check(speshCinematic.GridWindow(1,3,320,30).visibleRows,1,"single episode viewport")
 scrollGridItem({top:112,gridTop:158,rowHeight:350,columns:3,node:{itemFocused:169}})
 check(m.scrollTarget,112,"last episode never scrolls outer panel off screen")
 scrollGridItem({top:112,gridTop:158,rowHeight:350,columns:3,node:{itemFocused:0}})
 check(m.scrollTarget,112,"first and last episodes share stable outer viewport")
 print "EPISODE INPUT AND ANCHOR REGRESSIONS PASSED"
end sub
`);
 const output=path.join(temp,'test.brs');
 await writeFile(output,(await program.getTranspiledFileContents(file)).code);
 const result=execFileSync(process.execPath,['node_modules/brs/bin/cli.js',output],{encoding:'utf8'});
 assert.ok(result.includes('EPISODE INPUT AND ANCHOR REGRESSIONS PASSED')&&!result.includes('FAIL:'),result);
 console.log(result.trim());
}finally{await rm(temp,{recursive:true,force:true});}
const modal=await readFile('components/details/SpotlightSectionModal.bs','utf8');
assert.match(modal,/createChild\("SpeshContextGrid"\)/);
assert.match(modal,/observeField\("contextSelected", "onGridItemSelected"\)/);
assert.match(modal,/content.replaceChild\(updated, card\)/);
assert.match(modal,/grid.numRows = visibleRows/);
assert.match(modal,/grid.vertFocusAnimationStyle = "floatingFocus"/);
const scroll=modal.match(/^sub scrollGridItem[^]*?^end sub/m)[0];
assert.ok(!scroll.includes('itemFocused'),'outer panel does not scroll by native item offset');
assert.match(modal,/cancelGridHolds\(\)\s+m.scrollAnim.control = "stop"/);
const menu=await readFile('components/itemMenu/ItemContextMenu.bs','utf8');
assert.ok(menu.indexOf('m.top.waitForSelectRelease and key')<menu.indexOf('if not press then return false'));
console.log('EPISODE CONTEXT WIRING CHECKS PASSED');
