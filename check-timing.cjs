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
const starts=[0,2,6,9,12,26],fades=[4,5,4,5,6,5];
for(const duration of [6,8,12]){sandbox.state.duration=duration;for(let frame=0;frame<duration*20;frame++){draws.length=0;sandbox.t=frame/20;vm.runInContext('render(c,t)',sandbox);assert.equal(stack.length,0);positions.forEach(([x,y],i)=>{const calls=draws.filter(d=>d.x===x&&d.y===y);assert(calls.length);const alpha=Math.max(...calls.map(d=>d.a));if(frame<=starts[i])assert.equal(alpha,0,`layer ${i} appeared early at frame ${frame}`);else if(frame<duration*20-[5,3,7,6,9,10][i]){assert(alpha>0,`layer ${i} missing at frame ${frame}`);if(frame>=starts[i]+fades[i])assert(alpha>.99)}});assert.equal(c.globalAlpha,1)}}
assert.equal(vm.runInContext('GIF_FPS',sandbox),20);
assert(source.includes('const count=state.duration*GIF_FPS;'));
assert(source.includes('render(g,i/GIF_FPS);'));
assert(source.includes('[33,249,4,0,100/GIF_FPS,0,0,0,44,'));
assert(source.includes('duration:6'));
console.log('PASS: reference entrance frames 1/3/7/10/13/27; every frame checked for 6/8/12-second loops. Default export: 120 frames, 50ms per frame, 6 seconds.');
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
assert.equal(chat(4.1).items[1].progress,1);
assert.equal(chat(0).items.length,0);
assert.equal(vm.runInContext('messageFrame(lines,0,false).items.length',sandbox),2);
sandbox.lines=['1','2','3','4','5'];assert.equal(chat(5.5).items.length,2);
sandbox.lines=['','내 답장'];assert.equal(chat(5.5).items.length,1);assert.equal(chat(5.5).items[0].index,1);
sandbox.lines=['상대 메시지',''];assert.equal(chat(5.5).items.length,1);assert.equal(chat(5.5).items[0].index,0);
sandbox.lines=['',''];assert.equal(chat(5.5).items.length,0);
console.log('PASS: typing dots, received bubble, progressive composer text, upward send, replay reset, effects-off and two-message limit and preserved sender for empty fields.');
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

sandbox.state.duration=6;
const phone=t=>sandbox.layerProgress(t,'phoneMusic');
assert.equal(phone(1.3).alpha,0);assert(phone(1.4).scaleX<phone(1.55).scaleX);
assert.equal(phone(1.55).alpha,1);assert.equal(phone(1.55).contentAlpha,0);assert.equal(phone(1.8).contentAlpha,1);
assert.equal(phone(5.5).scaleX,1);assert(phone(5.6).scaleX<phone(5.5).scaleX);assert.equal(phone(5.75).alpha,0);
console.log('PASS: phone capsule expands and settles on frames 26–34, reveals content on 31–36, and shrinks away on 110–115.');

const musicScales=Array.from({length:9},(_,i)=>sandbox.layerProgress((12+i)/20,'music').scale);
const phoneScales=Array.from({length:9},(_,i)=>phone((26+i)/20).scaleX);
assert(musicScales[0]<1&&Math.max(...musicScales)>1.03);assert.equal(musicScales.at(-1),1);
assert(phoneScales[0]<1&&Math.max(...phoneScales)>1.06);assert.equal(phoneScales.at(-1),1);
assert(Math.max(...musicScales)>musicScales.at(-1));assert(Math.max(...phoneScales)>phoneScales.at(-1));
console.log('PASS: both players overshoot their final size and settle back to exactly 100%.');

sandbox.state.duration=6;sandbox.lines=['받은 메시지','입력 중인 답장'];
assert.equal(chat(3.5).draft,'입력 중인 답장');assert.equal(chat(3.7).draft,'입력 중인 답장');
assert(chat(1.96).typingOpacity<chat(1.7).typingOpacity);
const inFlight=chat(3.95).items[1];assert(inFlight.progress<1);assert(sandbox.playerPop(inFlight.progress)>1);
assert.equal(chat(4.1).items[1].progress,1);assert.equal(chat(3.8).draft,'');
console.log('PASS: typing indicator fades, completed draft holds before sending, and the reply overshoots then settles.');

for(const duration of [6,8,12]){
 sandbox.state.duration=duration;const ordered=['phoneMusic','music','name','messages','quote','main'],begins=[];
 for(const layer of ordered){let first=-1,lastAlpha=1;for(let f=duration*20-15;f<=duration*20;f++){const a=sandbox.layerProgress(f/20,layer).alpha;if(a<.999&&first<0)first=f;assert(a<=lastAlpha+1e-8);lastAlpha=a}begins.push(first);assert.equal(lastAlpha,0)}
 assert(begins.every((frame,i)=>i===0||frame>begins[i-1]),`Exit order at ${duration}s: ${begins}`);
 assert.equal(sandbox.layerProgress((duration*20-4)/20,'music').alpha,0);
 assert.equal(sandbox.layerProgress((duration*20-4)/20,'main').alpha,1);
}
console.log('PASS: phone music → music → name → messages → quote → main exit independently in every loop duration.');
const tintDirections=[];const tintContext=new Proxy({createLinearGradient(...points){tintDirections.push(points);return {addColorStop(){}}}},{get(o,k){return k in o?o[k]:()=>{}}});
sandbox.glass(tintContext,10,20,100,60,12,.7,'none');assert.equal(tintDirections.length,0);
sandbox.glass(tintContext,10,20,100,60,12,.7,'name');assert.deepEqual(tintDirections.pop(),[110,20,10,80]);
sandbox.glass(tintContext,10,20,100,60,12,.7,'messages');assert.deepEqual(tintDirections.pop(),[10,80,110,20]);
console.log('PASS: phone player has no tint gradient; name card gradient direction is preserved.');

const windowPaths=[],windowFills=[];let activePath=[];
const windowContext=new Proxy({beginPath(){activePath=[]},roundRect(...args){activePath.push(args)},fill(rule){windowFills.push({rule,paths:activePath.slice(),paint:this.fillStyle})},createLinearGradient(){return {kind:'tint',addColorStop(){}}}},{get(o,k){return k in o?o[k]:()=>{}}});
sandbox.messageWindow(windowContext,615,522,295,390);
const colored=windowFills.filter(f=>f.paint?.kind==='tint');assert.equal(colored.length,1);assert.equal(colored[0].rule,'evenodd');
assert.deepEqual(colored[0].paths,[[615,522,295,390,26],[660,546,246,361,18]]);
console.log('PASS: message gradient fills only the outer frame and excludes the neutral conversation interior.');
const bubbleColors=[];sandbox.speechBubble=(context,x,y,w,h,color)=>bubbleColors.push({x,color});
Object.assign(sandbox.state,{quoteColor:'#112233',messageColor:'#bbccdd',accent:'#ee7799',reply:'#99ccdd',chat:false,duration:6});
sandbox.render(c,4.5);const initial=bubbleColors.slice();bubbleColors.length=0;
sandbox.state.accent='#335577';sandbox.state.reply='#775533';sandbox.render(c,4.5);
assert.deepEqual(bubbleColors,initial);assert(initial.some(b=>b.x===530&&b.color==='#112233'));assert(initial.some(b=>b.color==='#bbccdd'));assert(initial.some(b=>b.color==='#f3f0f3'));
assert.equal(sandbox.bubbleTextColor('#000000'),'#ffffff');assert.equal(sandbox.bubbleTextColor('#ffffff'),'#423743');
console.log('PASS: gradient colors are independent of quote/reply bubbles; incoming gray stays fixed and text contrast adapts.');
const backgroundGradients=[];
const backgroundContext={fillRect(){},createLinearGradient(...points){const gradient={points,stops:[],addColorStop(...stop){this.stops.push(stop)}};backgroundGradients.push(gradient);return gradient}};
Object.assign(sandbox.state,{bgMode:'twoTone',bg:'#000000',bgLeft:'#ead7e4',bgEnd:'#b49bc9',bgStart:60});
sandbox.drawBackground(backgroundContext,1416,984);
assert.deepEqual(backgroundGradients.map(g=>g.points),[[0,0,1416,0],[0,0,0,984]]);
assert.deepEqual(backgroundGradients[0].stops,[[0,'#ead7e4'],[1,'#b49bc9']]);
assert.deepEqual(backgroundGradients[1].stops,[[0,'#000000'],[.6,'#000000'],[1,'#00000000']]);
console.log('PASS: two-tone background keeps the top solid and reveals independent left/right colors below the transition.');
