import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import bsc from 'brighterscript';
const directory=await mkdtemp(path.join(tmpdir(),'spesh-cinematic-'));
try {
 let source=(await readFile('source/utils/speshCalendar.bs','utf8')).replace(/^import.*$/mg,'')+'\n'+(await readFile('source/utils/speshCinematic.bs','utf8')).replace(/^import.*$/mg,'');
 for(const [file,name] of [['components/cinematic/SpeshCalendar.bs','onCalendarSource'],['components/details/SpotlightSectionModal.bs','onSeasonFrameLoaded']]) {
  const text=await readFile(file,'utf8');
  source+='\n'+text.match(new RegExp(`^sub ${name}\\([^]*?^end sub`,'m'))[0];
 }
 const program=new bsc.Program({rootDir:directory});
 const input=path.join(directory,'test.bs');
 program.setFile({src:input,dest:'source/test.bs'},source+`
function toString(value)
 if value = invalid then return ""
 if GetInterface(value,"ifString") <> invalid then return value
 return value.toStr()
end function
function isValid(value)
 return value <> invalid
end function
function get_url()
 return "server"
end function
function tr(value)
 return value
end function
sub drawAgenda()
 m.drewAgenda=true
end sub
sub buildSections(value)
 m.builtSections=value
end sub
sub returnToSeasonPicker()
 m.returnedToSeasons=true
end sub
sub check(value, expected, label)
 if value <> expected
  print "FAIL: ";label;" got ";value;" expected ";expected
  stop
 end if
end sub
sub Main()
 m.scope="server|u|today"
 task={identity:"live",isSameNode:function(other)
  return m.identity=other.identity
 end function}
 event={node:task,data:{source:"Sonarr",scope:m.scope,error:"",entries:[{key:"tv"}]},getRoSGNode:function()
  return m.node
 end function,getData:function()
  return m.data
 end function}
 m.tasks=[task]
 m.global={session:{user:{id:"u"}},speshCalendarCache:{},hasField:function(name)
  return true
 end function}
 m.pending={Sonarr:true}
 m.groups={Jellyfin:[{key:"local"}]}
 m.failures={}
 onCalendarSource(event)
 check(m.groups.Sonarr.count(),1,"independent source publishes")
 check(m.groups.Jellyfin.count(),1,"other source retained")
 event.data={source:"Radarr",scope:m.scope,error:"unavailable",entries:[]}
 onCalendarSource(event)
 check(m.groups.Jellyfin.count(),1,"partial error retains library")
 check(m.failures.Radarr,"unavailable","partial error reported")
 m.global.session.user.id="other-user"
 m.drewAgenda=false
 onCalendarSource(event)
 check(m.drewAgenda,false,"member switch rejects stale source")
 m.top={visible:true,header:{text:""},findNode:function(id)
  return m.header
 end function}
 m.seasonPickerCard={id:"seasons"}
 m.seasonEpisodeTask=task
 m.seasonEpisodeId="s2"
 event.data={seasonId:"s1",ok:true,items:[{}]}
 onSeasonFrameLoaded(event)
 check(m.builtSections,invalid,"stale season rejected")
 event.data.seasonId="s2"
 onSeasonFrameLoaded(event)
 check(m.builtSections.count(),1,"current season opens episode frame")
 m.top.visible=false
 m.builtSections=invalid
 onSeasonFrameLoaded(event)
 check(m.builtSections,invalid,"closed season frame ignores load")
 check(speshCalendar.Sunday(2026,3,2),8,"March DST day")
 check(speshCalendar.Sunday(2026,11,1),1,"November DST day")
 check(speshCalendar.Eastern("2026-03-08T06:59:59Z",true).clock,"01:59 EST","before spring")
 check(speshCalendar.Eastern("2026-03-08T07:00:00Z",true).clock,"03:00 EDT","after spring")
 check(speshCalendar.Eastern("2026-11-01T05:59:59Z",true).clock,"01:59 EDT","before fall")
 check(speshCalendar.Eastern("2026-11-01T06:00:00Z",true).clock,"01:00 EST","after fall")
 check(speshCalendar.Eastern("2026-11-15T02:00:00Z",true).day,"2026-11-14","Eastern grouping")
 check(speshCalendar.Eastern("2026-11-15T03:00:00+01:00",true).clock,"21:00 EST","offset timestamp")
 check(speshCalendar.Eastern("2026-11-15",false).day,"2026-11-15","date-only day")
 check(speshCalendar.Eastern("2026-11-15",false).clock,"Time unavailable","date-only time")
 check(speshCalendar.HasTime("2026-11-15"),false,"no invented time")
 check(speshCalendar.HasTime("2026-11-15T10:30:00"),false,"timezone required")
 check(speshCalendar.HasTime("2026-11-15T00:00:00Z"),true,"real midnight allowed")
 check(speshCinematic.EpisodeLabel({IndexNumber:1,Name:"The Big Problem"}),"1 · The Big Problem","episode number")
 check(speshCinematic.EpisodeLabel({IndexNumber:1,IndexNumberEnd:2,Name:"Premiere"}),"1–2 · Premiere","episode range")
 check(speshCinematic.EpisodeLabel({Name:"Special"}),"Special","unnumbered special")
 ordered=speshCalendar.Ordered([[{key:"b",day:"2026-12-02",sort:"2026-12-02"},{key:"old",day:"2026-11-14",sort:"2026-11-14"}],[{key:"a",day:"2026-11-15",sort:"2026-11-15"},{key:"b",day:"2026-12-02",sort:"2026-12-02"}]],"2026-11-15","2027-02-13")
 check(ordered.count(),2,"range and dedupe")
 check(ordered[0].key,"a","agenda ordering across months")
 merged=speshCalendar.Ordered([[{key:"air",episodeKey:"series|1|1",day:"2026-11-15",sort:"2026-11-15T20:00",localId:"",art:"remote"}],[{key:"lib",episodeKey:"series|1|1",day:"2026-11-15",sort:"2026-11-15T99:99",localId:"local-episode",art:"local-art"}]],"2026-11-15","2027-02-13")
 check(merged.count(),1,"matching airing and library deduped")
 check(merged[0].localId,"local-episode","local route retained")
 check(merged[0].sort,"2026-11-15T20:00","supplied airing retained")
 print "CINEMATIC MODEL REGRESSIONS PASSED"
end sub
`);
 const output=path.join(directory,'test.brs');
 const compiled=(await program.getTranspiledFileContents(input)).code;
 await writeFile(output,compiled);
 const result=execFileSync(process.execPath,['node_modules/brs/bin/cli.js',output],{encoding:'utf8'});
 assert.ok(result.includes('CINEMATIC MODEL REGRESSIONS PASSED')&&!result.includes('FAIL:'),result);
 console.log(result.trim());
} finally {await rm(directory,{recursive:true,force:true});}
const theme=JSON.parse(await readFile('settings/themes/spesh-cinematic.json','utf8'));
assert.equal(theme.colors.background,'#000000');
assert.equal(theme.colors.accent,'#F3C564');
assert.equal(theme.colors.inputBorderFocused,'#8ABCF4');
for(const file of ['components/Sidebar.bs','components/JFOverhang.bs']){
 const text=await readFile(file,'utf8');
 for(const id of ['shuffle','genres','favorites'])assert.ok(!text.includes(`m.navItems.push(m.${id}Item)`));
 for(const id of ['studios','calendar'])assert.ok(text.includes(`m.navItems.push(m.${id}Item)`));
}
const services=await readFile('source/utils/speshServices.bs','utf8');
for(const id of [213,2739,1024,2552,453,3186,4330,3353,4353]) assert.ok(services.includes(`id: ${id},`));
for(const slug of ['netflix','disneyplus','amazonprime','appletv','hulu','hbo','paramountplus','peacock','discoveryplus'])await access(`images/services/${slug}.png`);
const modal=await readFile('components/details/SpotlightSectionModal.bs','utf8');
assert.match(modal,/if not event.getRoSGNode\(\).isSameNode\(m.seasonEpisodeTask\) then return/);
assert.match(modal,/m.sections\[held.section\].node.jumpToItem = held.item/);
const preview=await readFile('components/home/mediaBarTrailer.bs','utf8');
assert.match(preview,/if trailerIdentity\(item\) <> m.trailerIdentity then return/);
assert.match(preview,/m.trailerTask.cancelRequested = true/);
const trailer=await readFile('components/details/TrailerOverlay.bs','utf8');
assert.match(trailer,/if m.closed = true then return/);
assert.match(trailer,/m.video.content = invalid/);
console.log('CINEMATIC NAVIGATION, ICONS, LIFETIME CHECKS PASSED');
