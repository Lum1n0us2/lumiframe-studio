// Record drawing operations without launching or controlling a browser.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/app.js','utf8');
const sandbox={ctx:{},audio:{},exporting:false};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/audio-metadata.js','utf8'),sandbox);
vm.runInContext(source.slice(source.indexOf('function rr('),source.indexOf('function tick(')),sandbox);
const stack=[],draws=[];let rect;
const c=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha)},restore(){assert(stack.length>0);this.globalAlpha=stack.pop()},roundRect(...args){rect=args},fill(){if(rect)draws.push({x:rect[0],y:rect[1],a:this.globalAlpha})},drawImage(im,x,y){draws.push({x,y,a:this.globalAlpha})},measureText(s){return {width:s.length*11}},createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}}},{get(o,k){return k in o?o[k]:()=>{}}});
sandbox.c=c;sandbox.state={duration:8,bg:'#fffafb',accent:'#efb3d0',reply:'#9cd8eb',float:false,sparkles:false,hearts:false,card:true,zoom:1,position:.5,switch:true,quote:'첫 줄\n둘째 줄\n셋째 줄',messages:'안녕\n반가워',pair:'이름',handle:'@pair',song:'노래',artist:'가수',chat:true};sandbox.imgs={main:{width:480,height:750}};sandbox.playing=true;
const originalBubble=sandbox.speechBubble;sandbox.speechBubble=(c,x,y,...args)=>{draws.push({x,y,a:c.globalAlpha});return originalBubble(c,x,y,...args)};
const positions=[[530,55],[100,138],[515,429],[615,522],[718,206],[981,720]];
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
const base=sandbox.mainImageBounds({width:480,height:750},1,.5);
const large=sandbox.mainImageBounds({width:480,height:750},2,.5);
assert.equal(base.width,480);assert.equal(large.width,960);assert.equal(large.height,1500);
assert.equal(base.x+base.width/2,large.x+large.width/2);
const wide=sandbox.mainImageBounds({width:1200,height:600},3,.5);
assert(Math.abs(wide.width-1440)<1e-8);assert.equal(wide.width/wide.height,2);
let clips=0,imageSize;const imageContext={save(){},restore(){},clip(){clips++},beginPath(){},roundRect(){},drawImage(im,x,y,w,h){imageSize=[w,h]}};
sandbox.state.zoom=2;sandbox.state.position=.5;sandbox.state.card=false;
sandbox.drawMainImage(imageContext,{width:480,height:750},0);
assert.equal(clips,0);assert.deepEqual(imageSize,[960,1500]);
sandbox.state.card=true;sandbox.drawMainImage(imageContext,{width:480,height:750},0);
assert.equal(clips,1);assert.deepEqual(imageSize,[960,1500]);
console.log('PASS: main image grows beyond the initial card size, keeps its aspect ratio and has no fixed clipping boundary.');
const effectNames=['sparkles','hearts','particles','circles','feathers'];
function effectTrace(time){const trace=[],saved=[];const recorder=new Proxy({globalAlpha:1,save(){saved.push(this.globalAlpha)},restore(){assert(saved.length);this.globalAlpha=saved.pop()}},{get(o,k){return k in o?o[k]:(...args)=>{for(const arg of args)if(typeof arg==='number')assert(Number.isFinite(arg));trace.push([k,o.globalAlpha,...args])}}});sandbox.drawAtmosphere(recorder,time,1416,984,true);assert.equal(saved.length,0);assert.equal(recorder.globalAlpha,1);return trace}
for(const name of effectNames){for(const key of effectNames)sandbox.state[key]=key===name;const first=effectTrace(1.25);assert(first.length>0);assert.deepEqual(effectTrace(1.25),first);assert.notDeepEqual(effectTrace(2.5),first);effectTrace(0);effectTrace(6)}
for(const key of effectNames)sandbox.state[key]=false;assert.equal(effectTrace(2).length,0);
console.log('PASS: five independent effects render finite paths, animate deterministically, and fully disappear when disabled.');
for(let frame=0;frame<120;frame++){
 const thirds=[0,0,0];
 for(let i=0;i<12;i++){const p=sandbox.featherPose(i,frame/120,1416,984);assert(p.x>=0&&p.x<=1416);if(p.y>=0&&p.y<=984)thirds[Math.min(2,Math.floor(p.x/472))]++}
 assert(thirds.every(n=>n>=1),`Feathers must span left/center/right at frame ${frame}: ${thirds}`);
}
for(let i=0;i<12;i++){const first=sandbox.featherPose(i,0,1416,984),last=sandbox.featherPose(i,1,1416,984);for(const key of Object.keys(first))assert(Math.abs(first[key]-last[key])<1e-8)}
console.log('PASS: feathers cover all three screen regions throughout 120 frames and repeat without a position jump.');

for(const side of ['left','right'])for(const alpha of [1,.5,.1]){
 let fills=0,paths=0;const bubbleContext=new Proxy({globalAlpha:alpha,beginPath(){paths++},fill(){fills++}},{get(o,k){return k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert(Number.isFinite(n))}}});
 originalBubble(bubbleContext,530,55,335,48,'#efb3d0',side,18,8);
 assert.equal(paths,1);assert.equal(fills,1);assert.equal(bubbleContext.globalAlpha,alpha);
}
console.log('PASS: left/right speech bubbles use a single filled silhouette at full and fading opacity.');
