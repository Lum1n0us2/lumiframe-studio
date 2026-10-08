// Record drawing operations without launching or controlling a browser.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/app.js','utf8');
const sandbox={ctx:{},audio:{},exporting:false};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/audio-metadata.js','utf8'),sandbox);
vm.runInContext(source.slice(source.indexOf('function rr('),source.indexOf('function tick(')),sandbox);
const stack=[],draws=[];let rect;
const c=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha)},restore(){assert(stack.length>0);this.globalAlpha=stack.pop()},roundRect(...args){rect=args},fill(){if(rect)draws.push({x:rect[0],y:rect[1],a:this.globalAlpha})},drawImage(im,x,y){draws.push({x,y,a:this.globalAlpha})},measureText(s){return {width:s.length*11}},createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}}},{get(o,k){return k in o?o[k]:()=>{}}});
sandbox.c=c;sandbox.state={duration:8,bg:'#fffafb',accent:'#efb3d0',reply:'#9cd8eb',float:false,sparkles:false,hearts:false,card:true,zoom:1,position:.5,switch:true,quote:'첫 줄\n둘째 줄\n셋째 줄',messages:'안녕\n반가워',pair:'이름',handle:'@pair',song:'노래',artist:'가수',chat:true};sandbox.imgs={main:{width:580,height:788}};sandbox.playing=true;
const positions=[[530,55],[75,110],[515,429],[615,522],[718,206],[981,720]];
const starts=[0,2,6,9,12,24],fades=[4,5,4,5,6,8];
for(const duration of [6,8,12]){sandbox.state.duration=duration;for(let frame=0;frame<duration*20;frame++){draws.length=0;sandbox.t=frame/20;vm.runInContext('render(c,t)',sandbox);assert.equal(stack.length,0);positions.forEach(([x,y],i)=>{const calls=draws.filter(d=>d.x===x&&d.y===y);assert(calls.length);const alpha=Math.max(...calls.map(d=>d.a));if(frame<=starts[i])assert.equal(alpha,0,`layer ${i} appeared early at frame ${frame}`);else if(frame<duration*20-9){assert(alpha>0,`layer ${i} missing at frame ${frame}`);if(frame>=starts[i]+fades[i])assert(alpha>.99)}});assert.equal(c.globalAlpha,1)}}
assert.equal(vm.runInContext('GIF_FPS',sandbox),20);
assert(source.includes('const count=state.duration*GIF_FPS;'));
assert(source.includes('render(g,i/GIF_FPS);'));
assert(source.includes('[33,249,4,0,100/GIF_FPS,0,0,0,44,'));
assert(source.includes('duration:6'));
console.log('PASS: reference entrance frames 1/3/7/10/13/25; every frame checked for 6/8/12-second loops. Default export: 120 frames, 50ms per frame, 6 seconds.');
// Match the reference's message phases, including deterministic scrubbing/export.
sandbox.state.duration=6;sandbox.lines=['받은 메시지','이것은 한 글자씩 입력되는 답장입니다'];
const chat=t=>{sandbox.t=t;return vm.runInContext('messageFrame(lines,t)',sandbox)};
assert.equal(chat(1).typing,false);
assert.equal(chat(1.2).typing,true);assert.equal(chat(1.9).items.length,0);
assert.equal(chat(2.2).items.length,1);assert.equal(chat(2.2).typing,false);
assert.equal(chat(2.5).draft,'');
assert(chat(2.6).draft.length>0);assert(chat(3.4).draft.length>chat(2.6).draft.length);
assert.equal(chat(3.7).items.length,1);
assert.equal(chat(3.8).items.length,2);assert.equal(chat(3.8).draft,'');
assert(chat(3.8).items[1].progress>0&&chat(3.8).items[1].progress<1);
assert.equal(chat(4).items[1].progress,1);
assert.equal(chat(0).items.length,0);
assert.equal(vm.runInContext('messageFrame(lines,0,false).items.length',sandbox),2);
sandbox.lines=['1','2','3','4','5'];assert.equal(chat(5.5).items.length,5);
console.log('PASS: typing dots, received bubble, progressive composer text, upward send, replay reset, effects-off and five-message completion.');
