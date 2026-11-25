import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import bsc from 'brighterscript';
const temp=await mkdtemp(path.join(tmpdir(),'roku-profiles-'));
try {
 let source=(await readFile('source/utils/speshProfiles.bs','utf8')).replace(/^import.*$/mg,'');
 source+='\n'+await readFile('source/utils/profileTaskIdentity.bs','utf8');
 const request=await readFile('source/api/baserequest.bs','utf8');
 for(const name of ['getAuthTokenFromRegistry','getActiveUserIdFromRegistry'])source+='\n'+request.match(new RegExp(`^function ${name}[^]*?^end function`,'m'))[0].replaceAll('type(m.top) = "roSGNode"','m.top <> invalid');
 source+='\n'+(await readFile('source/api/sdk.bs','utf8')).match(/function GetResumeItems[^]*?end function/)[0];
 const picker=await readFile('components/profiles/SpeshProfiles.bs','utf8');
 source+='\n'+picker.match(/^function onKeyEvent[^]*?^end function/m)[0];
 const userData=await readFile('components/data/UserData.bs','utf8');
 source+='\n'+userData.match(/^sub saveToRegistry[^]*?^end sub/m)[0];
 source+='\n'+(await readFile('components/profiles/SpeshProfileFence.bs','utf8')).replace('sub init()', 'sub fenceInit()');
 const lifecycleSource=await readFile('source/utils/speshProfileLifecycle.bs','utf8');
 source+='\n'+lifecycleSource.match(/^sub RetireSpeshProfileRuntime[^]*?^end sub/m)[0].replace('wait(750, port)','profileWait(750, port)');
 const program=new bsc.Program({rootDir:temp});
 const input=path.join(temp,'test.bs');
 program.setFile({src:input,dest:'source/test.bs'},source+`
function APIRequest(route,params)
 m.resumeParams=params
 return {AddHeader:sub(name,value)
  m.cacheControl=value
 end sub}
end function
function getJson(req)
 return {Items:[],UserId:m.resumeParams.UserId}
end function
function toString(value)
 if value=invalid then return ""
 if GetInterface(value,"ifString")<>invalid then return value
 return value.toStr()
end function
function isValid(value)
 return value<>invalid
end function
function isValidAndNotEmpty(value)
 if value=invalid then return false
 return value<>""
end function
function isChainValid(value,key)
 if value=invalid then return false
 return value.DoesExist(key)
end function
function getRuntimeContextValue(key)
 return "old-owner-runtime"
end function
function getRegistryValue(section,key)
 m.registryReads++
 return "owner-registry"
end function
function get_setting(key,fallback="")
 return "[]"
end function
sub set_setting(key,value)
 m.registryWrites++
end sub
sub requestProfiles(op)
 m.requests++
 m.lastOperation=op
 m.busy=true
end sub
sub draw()
 m.drawn=true
end sub
sub stopProfileTimers(node)
 m.stoppedTimers=true
end sub
function profileWait(milliseconds,port)
 m.waited=milliseconds
 return invalid
end function
sub editName()
 m.editing=true
end sub
sub check(value,expected,label)
 if value<>expected
  print "FAIL: ";label
  stop
 end if
end sub
sub Main()
 owner={id:"owner",authToken:"owner-token",settings:{token:"owner-token",username:"owner-name",theme:"cinematic"}}
 primary={profile:{id:"main",name:"Profile 1"},userId:"owner",accessToken:invalid,user:{Id:"owner",Policy:{IsAdministrator:true},UserData:{PlaybackPositionTicks:123}}}
 user=speshProfiles.Selection(owner,primary)
 check(user.authToken,"owner-token","main uses original owner token")
 check(user.UserData.PlaybackPositionTicks,123,"main history stays intact")
 check(owner.settings.token,"owner-token","owner credential remains intact")
 child={profile:{id:"p2",name:"Second"},userId:"child",accessToken:"child-token",user:{Id:"child",Policy:{IsAdministrator:false}}}
 user=speshProfiles.Selection(owner,child)
 check(user.id,"child","managed uses actual Jellyfin identity")
 check(user.authToken,"child-token","managed uses its token")
 check(user.name,"Second","managed login name is not displayed")
 check(user.settings.token,invalid,"owner token excluded from profile settings")
 check(child.user.authToken,invalid,"selection does not mutate input DTO")
 restored=speshProfiles.Selection(owner,primary)
 check(restored.id,"owner","return to main restores original identity")
 check(restored.authToken,"owner-token","return to main restores original token")
 child.accessToken=invalid
 check(speshProfiles.Selection(owner,child),invalid,"no fallback to owner token")
 child.accessToken="child-token"
 child.user.Policy.IsAdministrator=true
 check(speshProfiles.Selection(owner,child),invalid,"managed admin rejected")
 child.user.Policy.IsAdministrator=false
 child.user.Id="different-user"
 check(speshProfiles.Selection(owner,child),invalid,"mismatched identity rejected")
 check(speshProfiles.ValidName(" "),false,"empty name rejected")
 check(speshProfiles.ValidName("1234567890123456789012345"),false,"long name rejected")
 check(speshProfiles.ValidName("Profile 1"),true,"valid name")
 check(speshProfiles.Avatars().count(),8,"eight original avatars")
 m.global={speshActiveProfile:{id:"p2"},session:{user:{id:"child",authToken:"child-token"}},hasField:function(key)
  return m.DoesExist(key)
 end function}
 m.registryReads=0
 m.registryWrites=0
 check(getAuthTokenFromRegistry(),"child-token","task live token precedes saved owner")
 check(getActiveUserIdFromRegistry(),"child","task live user precedes saved owner")
 check(m.registryReads,0,"no owner registry fallback for managed identity")
 saveToRegistry()
 check(m.registryWrites,0,"managed identity never enters saved-account list")
 m.top={cancelled:false}
 m.mode="profiles"
 m.manage=false
 m.busy=false
 m.compatible=false
 m.profiles=[{id:"main",name:"Profile 1",avatar:"blue"},{id:"p2",name:"Second",avatar:"gold"},{id:"p3",name:"Third",avatar:"teal"}]
 m.index=2
 m.requests=0
 onKeyEvent("right",true)
 check(m.index,2,"Add hidden at three")
 onKeyEvent("OK",true)
 onKeyEvent("OK",true)
 check(m.requests,1,"held select does not duplicate request")
 m.busy=false
 m.mode="avatars"
 m.returnIndex=1
 onKeyEvent("back",true)
 check(m.mode,"profiles","avatar Back returns to picker")
 check(m.index,1,"avatar Back restores profile focus")
 onKeyEvent("back",true)
 check(m.top.cancelled,true,"picker Back cancels without changing session")
 m.top={closed:false,generation:0}
 fenceInit()
 oldTask={identity:"old",state:"run",hasField:function(key)
  return m.DoesExist(key)
 end function,addFields:sub(fields)
  m.Append(fields)
 end sub,isSameNode:function(other)
  return m.identity=other.identity
 end function}
 check(acceptTask(oldTask),true,"current task registered")
 retireTasks()
 check(m.top.closed,true,"switch closes request barrier")
 check(oldTask.control,"STOP","old task cancelled before identity change")
 check(acceptTask(oldTask),false,"no work allowed while switching")
 resumeRequests()
 check(acceptTask(oldTask),false,"old generation never resumes under new identity")
 newTask={identity:"new",state:"run",hasField:oldTask.hasField,addFields:oldTask.addFields,isSameNode:oldTask.isSameNode}
 check(acceptTask(newTask),true,"new identity can start new work")
 m.scene={visible:true}
 m.global={speshProfileFence:{callFunc:function(name)
  m.called=name
  return invalid
 end function},speshProfileScene:"old-scene",sceneManager:{callFunc:function(name)
  m.called=name
  return invalid
 end function},session:{user:{id:"owner"}},ownerCache:"owner-history",getFields:function()
  return {speshProfileFence:m.speshProfileFence,speshProfileScene:m.speshProfileScene,id:"",focusedChild:invalid,change:invalid,session:m.session,ownerCache:m.ownerCache,sceneManager:m.sceneManager}
 end function,removeField:sub(key)
  m.Delete(key)
 end sub}
 RetireSpeshProfileRuntime()
 check(m.global.speshProfileFence.called,"retireTasks","requests retired before session reset")
 check(m.global.session,invalid,"old user session removed before new login")
 check(m.global.ownerCache,invalid,"old history cache removed")
 check(m.global.speshProfileScene,"old-scene","scene barrier retained during reset")
 check(m.stoppedTimers,true,"old view timers stopped")
 check(m.scene.visible,false,"old view hidden")
 check(m.waited,750,"render callbacks settle before globals are reset")
 m.global={speshProfileFence:{generation:7,closed:false,callFunc:function(name,node)
  return true
 end function},session:{user:{id:"child",authToken:"child-token"},server:{url:"https://example.test"}}}
 m.top={addFields:sub(fields)
  m.Append(fields)
 end sub,hasField:function(name)
  return m.DoesExist(name)
 end function}
 profileTaskIdentity.Capture()
 check(m.top.speshTaskContext.userId,"child","task captures selected identity")
 check(m.top.speshTaskContext.authToken,"child-token","task captures selected token")
 check(profileTaskIdentity.IsCurrent(),true,"current task may publish")
 m.global.session.user={id:"different",authToken:"different-token"}
 check(getActiveUserIdFromRegistry(),"child","task cannot adopt later identity")
 check(getAuthTokenFromRegistry(),"child-token","task cannot adopt later token")
 m.global.speshProfileFence.generation=8
 check(profileTaskIdentity.IsCurrent(),false,"retired task cannot publish to next profile")
 m.global.speshActiveProfile={id:"second"}
 m.global.speshProfileFence.generation=7
 supplied={Limit:64}
 answer=GetResumeItems(supplied)
 check(answer.UserId,"child","resume includes originating profile ID")
 check(supplied.UserId,invalid,"caller parameters not modified")
 answer=GetResumeItems({UserId:"owner"})
 check(answer,invalid,"owner resume query rejected under managed profile")
 print "VIEWING PROFILE TOKEN, HISTORY, PERMISSION AND FOCUS TESTS PASSED"
end sub
`);
 const output=path.join(temp,'test.brs');
 await writeFile(output,(await program.getTranspiledFileContents(input)).code);
 const result=execFileSync(process.execPath,['node_modules/brs/bin/cli.js',output],{encoding:'utf8'});
 assert.ok(result.includes('VIEWING PROFILE TOKEN, HISTORY, PERMISSION AND FOCUS TESTS PASSED')&&!result.includes('FAIL:'),result);
 console.log(result.trim());
}finally{await rm(temp,{recursive:true,force:true});}
const lifecycle=await readFile('source/utils/speshProfileLifecycle.bs','utf8');
assert.ok(!/session\.user\.Login\(/.test(lifecycle));
assert.match(lifecycle,/quietSince/);
assert.match(lifecycle,/profileReportsDrained/);
const task=await readFile('components/profiles/SpeshProfilesTask.bs','utf8');
assert.match(task,/APIRequestForServer\(r.serverUrl, owner.id, owner.authToken, path\)/);
assert.match(task,/req.SetRequest\("PUT"\)/);
const multi=await readFile('source/utils/multiserver.bs','utf8');
assert.match(multi,/speshActiveProfile.id <> "main" then return \[\]/);
const main=await readFile('source/Main.bs','utf8');
assert.match(main,/DrainSpeshProfilePlayback\(\)[^]*?goto profile_runtime_restart/);
assert.ok(!main.includes('m.screen.Close()'),'profile selection never closes the Roku screen');
assert.ok(main.indexOf('m.screen.show()')<main.indexOf('CreateObject("roSGNode", "SpeshProfileFence")'),'profile fence is created only after Roku screen Show');
assert.match(lifecycle,/retireTasks[^]*?clearScenes[^]*?stopProfileTimers[^]*?removeField/);
const logout=await readFile('source/api/userauth.bs','utf8');
assert.ok(logout.indexOf('session.Update("user", m.global.speshProfileOwner)')<logout.indexOf('unset_user_setting("token")'));
const session=await readFile('source/utils/session.bs','utf8');
assert.match(session,/deviceName = localGlobal.speshProfileOwner._profileDeviceId/);
const transport=await readFile('source/api/baserequest.bs','utf8');
assert.ok(!transport.includes('callFunc("acceptTask"'), "HTTP worker never rendezvous with render thread");
assert.match(transport,/speshTaskContext.generation = fence.generation/);
assert.ok(main.indexOf("profileApplied = true") < main.indexOf('callFunc("resetProfileViews")'));
assert.match(main,/if not isValid\(m.scene\)\s+m.scene = m.screen.CreateScene/);
console.log('VIEWING PROFILE LIFECYCLE AND PERSISTENCE WIRING PASSED');

async function taskFiles(dir){const list=await readdir(dir,{withFileTypes:true});return (await Promise.all(list.map(e=>e.isDirectory()?taskFiles(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
for(const file of (await taskFiles('components')).filter(p=>p.endsWith('.xml'))){if(path.basename(file)!=='SpeshUpdateTask.xml' && /extends="Task"/i.test(await readFile(file,'utf8')))assert.match(await readFile(file.replace(/\.xml$/,'.bs'),'utf8'),/profileTaskIdentity.Capture\(\)/,file);}

const rootXml=await readFile('components/BaseScene.xml','utf8');
const rootCode=await readFile('components/BaseScene.bs','utf8');
assert.match(rootXml,/<children>\s*<Group id="content" \/>\s*<\/children>/);
assert.ok(!rootCode.includes('m.top.removeChildrenIndex'),'profile resets preserve XML content anchor');
assert.match(rootCode,/if not child.isSameNode\(content\) then m.top.removeChild\(child\)/);
assert.ok(!rootCode.includes('{id:"content",kind:"Group"}'),'never replace XML anchor with same-id detached lookup');
console.log('PROFILE ROOT ATTACHMENT REGRESSIONS PASSED');

const sdk=await readFile('source/api/sdk.bs','utf8');
const resume=sdk.match(/function GetResumeItems[^]*?end function/)[0];
assert.match(resume,/targetParams.UserId = userId/);
assert.match(resume,/if userId <> getActiveUserIdFromRegistry\(\) then return invalid/);
assert.match(resume,/no-cache, no-store/);
assert.match(task,/selected.userId, token, "Users\/Me"/);
console.log('PROFILE RESUME SCOPING AND TOKEN VALIDATION PASSED');

const pickerCode=await readFile('components/profiles/SpeshProfiles.bs','utf8');
const editor=pickerCode.match(/sub editName\(\)[^]*?end sub/)[0];
assert.ok(editor.indexOf('m.keyboard.visible = false') < editor.indexOf('m.keyboard.titleText'));
assert.ok(editor.indexOf('m.top.appendChild(m.keyboard)') < editor.indexOf('m.keyboard.visible = true'));
assert.ok(editor.indexOf('m.mode = "keyboard"') < editor.indexOf('m.keyboard.visible = true'));
assert.match(pickerCode,/sub closeKeyboard\(\)\s+m.keyboard.visible = false/);
console.log('PROFILE EDITOR VISIBILITY AND FOCUS WIRING PASSED');
