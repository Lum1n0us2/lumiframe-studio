const $=id=>document.getElementById(id);
const presets=[
 {name:'분홍빛 설렘',en:'PINK DAYDREAM',bg:'#fffafb',accent:'#efb3d0',reply:'#9cd8eb',pair:'Pair Name',handle:'@ID',quote:'Sample Text',song:'Song Title',artist:'Artist'}
];
const backgroundDefaults={bgMode:'solid',bgEnd:'#b49bc9',bgDirection:'down',bgStart:60};
let state={...backgroundDefaults,theme:3,...presets[0],messages:'Text1\nText2\nText3',zoom:1,position:.5,card:false,sparkles:true,hearts:true,float:true,chat:true,switch:true,duration:6};
let musicRequest=0;
let sources={},imgs={},playing=true,elapsed=0,last=performance.now(),exporting=false,audio=new Audio();
const canvas=$('canvas'),ctx=canvas.getContext('2d');
const keys=['bgMode','bgEnd','bgDirection','bgStart','bg','accent','reply','pair','handle','quote','messages','song','artist','zoom','position','card','sparkles','hearts','float','chat','switch','duration'];
const slots=[['main','메인 일러스트','왼쪽의 큰 이미지'],['a','스마트폰 · A','첫 번째 화면'],['b','스마트폰 · B','두 번째 화면'],['cover','앨범 커버','음악 위젯의 작은 이미지'],['profile','프로필 이미지','이름 카드의 원형 프로필'],...Array.from({length:6},(_,i)=>[`chat${i+1}`,`메시지 프로필 ${i+1}`,`메시지 창 왼쪽 · 위에서 ${i+1}번째`])];
function completeAssets(assets){return Object.fromEntries(slots.map(([k])=>[k,assets[k]??null]))}
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2600)}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
function placeholder(key){
 const c=document.createElement('canvas'),large=['main','a','b'].includes(key);
 c.width=key==='main'?480:large?324:96;c.height=key==='main'?750:large?700:96;c.isPlaceholder=true;
 const g=c.getContext('2d'),w=c.width,h=c.height,dark=parseInt(state.bg.slice(1,3),16)<100;
 g.fillStyle=dark?'#292735':'#eee8ee';g.fillRect(0,0,w,h);
 g.strokeStyle=dark?'#777080':'#c7b9c6';g.lineWidth=large?2:1;g.setLineDash(large?[9,9]:[4,4]);g.strokeRect(large?20:5,large?20:5,w-(large?40:10),h-(large?40:10));g.setLineDash([]);
 const cx=w*.5,cy=h*.42,r=large?35:14;
 g.fillStyle=dark?'#9b90a5':'#b9a8b9';g.beginPath();g.arc(cx,cy-r*.8,r*.65,0,Math.PI*2);g.fill();g.beginPath();g.ellipse(cx,cy+r,r*1.15,r*.75,0,Math.PI,Math.PI*2);g.fill();
 if(large){const label=key==='main'?'메인 일러스트':key==='a'?'스마트폰 화면 A':'스마트폰 화면 B';text(g,label,cx,cy+90,key==='main'?24:18,dark?'#d4c8db':'#8f7e92','center',500);text(g,'이미지를 추가해주세요',cx,cy+122,key==='main'?17:13,dark?'#a99baf':'#a192a4','center')}
 else text(g,key==='cover'?'앨범':key==='profile'?'프로필':key.replace('chat',''),w/2,83,11,dark?'#d4c8db':'#8f7e92','center');
 return c;
}
async function setAssets(){for(const [k] of slots){if(!imgs[k]||imgs[k].isPlaceholder){sources[k]=null;imgs[k]=placeholder(k)}}updateUploads()}
function syncBackground(){$('gradientOptions').hidden=state.bgMode!=='gradient';$('bgStartValue').textContent=state.bgStart+'%'}
function sync(){syncBackground();$('zoomValue').textContent=Math.round(state.zoom*100)+'%';$('trackDuration').value=state.trackDuration?musicTime(state.trackDuration):'음악 파일을 선택해주세요';keys.forEach(k=>{if($(k).type==='checkbox')$(k).checked=state[k];else $(k).value=state[k]});$('seek').max=state.duration;$('length').textContent=`00:${String(state.duration).padStart(2,'0')}`}
const imageGroups={main:['main'],phone:['a','b'],cover:['cover'],profile:['profile'],chat:Array.from({length:6},(_,i)=>`chat${i+1}`)};
slots.forEach(([k,title,sub])=>{const label=document.createElement('label');label.className='upload'+(k.startsWith('chat')?' compact-profile':'');label.innerHTML=`<img id="thumb-${k}" alt=""><span><b>${k.startsWith('chat')?k.replace('chat','프로필 '):title}</b><small>${sub}</small></span><span class="plus">＋</span><input id="file-${k}" type="file" accept="image/*">`;const group=Object.keys(imageGroups).find(g=>imageGroups[g].includes(k));$('uploads-'+group).append(label);$('file-'+k).onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>25*1024*1024)throw Error('25MB 이하 이미지를 선택해주세요.');const src=await readFile(f);const im=await loadImage(src);sources[k]=src;imgs[k]=im;if(k==='main'){state.zoom=1;state.position=.5;sync()}updateUploads();toast('이미지를 바꿨어요.')}catch(err){toast(err.message||'이미지를 읽을 수 없어요.')}}});
function updateUploads(){slots.forEach(([k])=>$('thumb-'+k).src=sources[k]||imgs[k].toDataURL());for(const [group,list] of Object.entries(imageGroups))$('count-'+group).textContent=`${list.filter(k=>sources[k]).length} / ${list.length}`}
function readFile(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}
keys.forEach(k=>$(k).addEventListener('input',()=>{state[k]=$(k).type==='checkbox'?$(k).checked:['zoom','position','duration','bgStart'].includes(k)?Number($(k).value):$(k).value;if(k==='zoom')$('zoomValue').textContent=Math.round(state.zoom*100)+'%';if(k.startsWith('bg'))syncBackground();if(k==='bg')setAssets();if(k==='duration'){elapsed%=state.duration;sync()}}));
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===b.dataset.tab))});
function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
function text(c,s,x,y,size=20,color='#fff',align='left',weight=400){c.font=`${weight} ${size}px "Noto Sans KR",sans-serif`;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);c.textAlign='left'}
function photo(c,im,x,y,w,h,r=0,zoom=1,pos=.5,fit='cover'){if(!im)return;c.save();rr(c,x,y,w,h,r);c.clip();const scale=(fit==='contain'?Math.min(w/im.width,h/im.height):Math.max(w/im.width,h/im.height))*zoom;const iw=im.width*scale,ih=im.height*scale;c.drawImage(im,x-(iw-w)*pos,y-(ih-h)*.5,iw,ih);c.restore()}
// Only the initial fit uses a reference size; scaling grows the actual image bounds.
function mainImageBounds(im,zoom,position,yOffset=0){
 const scale=Math.min(480/im.width,750/im.height)*zoom;
 const width=im.width*scale,height=im.height*scale;
 return {x:340+(position-.5)*900-width/2,y:513+yOffset-height/2,width,height};
}
function drawMainImage(c,im,yOffset){
 if(!im)return;const b=mainImageBounds(im,state.zoom,state.position,yOffset);
 c.save();if(state.card){rr(c,b.x,b.y,b.width,b.height,Math.min(35*state.zoom,b.width/2,b.height/2));c.clip()}
 c.drawImage(im,b.x,b.y,b.width,b.height);c.restore();
}
function glass(c,x,y,w,h,r,opacity=.82){c.save();c.shadowColor='#22132d20';c.shadowBlur=28;c.shadowOffsetY=10;rr(c,x,y,w,h,r,`rgba(255,255,255,${opacity})`);c.restore();const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,state.accent+'60');g.addColorStop(.6,'#ffffff12');g.addColorStop(1,state.reply+'40');rr(c,x,y,w,h,r,g,'#ffffffa0')}
function textLines(c,str,width,size){c.font=`500 ${size}px "Noto Sans KR",sans-serif`;let line='',lines=[];for(const ch of str){if(ch==='\n'){lines.push(line);line=''}else if(line&&c.measureText(line+ch).width>width){lines.push(line);line=ch}else line+=ch}lines.push(line);return lines}
function drawLines(c,lines,x,y,size,color){lines.forEach((line,i)=>text(c,line,x,y+i*size*1.5,size,color,'left',500))}
function star(c,x,y,r,a,color){c.save();c.globalAlpha=a;c.fillStyle=color;c.beginPath();c.moveTo(x,y-r);c.quadraticCurveTo(x+2,y-2,x+r,y);c.quadraticCurveTo(x+2,y+2,x,y+r);c.quadraticCurveTo(x-2,y+2,x-r,y);c.quadraticCurveTo(x-2,y-2,x,y-r);c.fill();c.restore()}
// Reference 1.gif: 120 frames, 50 ms per frame (6 seconds at 20 FPS).
const GIF_FPS=20;
const entranceFrames={quote:[0,4],main:[2,5],name:[6,4],messages:[9,5],music:[12,6],phoneMusic:[24,8]};
function layerProgress(t,layer){
 const [start,fade]=entranceFrames[layer],frame=t*GIF_FPS;
 const progress=Math.max(0,Math.min(1,(frame-start)/fade));
 const ease=progress*progress*(3-2*progress);
 const outro=Math.max(0,Math.min(1,(state.duration-t)/.45));
 return {alpha:ease*outro,offset:18*(1-ease)};
}
function beginLayer(c,t,layer){const p=layerProgress(t,layer);c.save();c.globalAlpha*=p.alpha;c.translate(0,p.offset)}
function endLayer(c){c.restore()}
// Reference chat: incoming dots, received bubble, composer typing, then send upward.
function messageFrame(lines,t,animated=true){
 const time=t*6/state.duration,items=[];let typing=false,draft='';
 for(let i=0;i<lines.length;i++){
  const extra=Math.max(1,lines.length-2),slot=1.05/extra;
  const start=i===0?1.1:i===1?2.55:4.25+(i-2)*slot;
  const send=i===0?2.1:i===1?3.75:start+slot*.65;
  const travel=i<2?.25:Math.min(.2,slot*.3);
  if(!animated||time>=send){items.push({index:i,text:lines[i],progress:animated?Math.max(0,Math.min(1,(time-send)/travel)):1});continue}
  if(time>=start){if(i%2){const chars=Array.from(lines[i]);draft=chars.slice(0,Math.min(chars.length,Math.floor((time-start)/(send-start)*chars.length)+1)).join('')}else typing=time<send-.1}
 }
 return {items,typing,draft};
}
function drawBackground(c,w,h){
 c.fillStyle=state.bg;c.fillRect(0,0,w,h);
 if(state.bgMode!=='gradient')return;
 const directions={down:[0,0,0,h],up:[0,h,0,0],right:[0,0,w,0],left:[w,0,0,0],diagonal:[0,0,w,h]};
 const gradient=c.createLinearGradient(...directions[state.bgDirection]);
 gradient.addColorStop(0,state.bg);gradient.addColorStop(state.bgStart/100,state.bg);gradient.addColorStop(1,state.bgEnd);
 c.fillStyle=gradient;c.fillRect(0,0,w,h);
}
function render(c,t){const w=1416,h=984,dark=parseInt(state.bg.slice(1,3),16)<100;const phase=t/state.duration,trackLength=state.trackDuration||state.duration,trackPosition=Math.min(trackLength,Math.max(0,c===ctx&&!exporting&&audio.src?audio.currentTime||0:t));c.clearRect(0,0,w,h);drawBackground(c,w,h);
 if(state.sparkles)for(let i=0;i<150;i++){const x=(i*733.17)%w,y=(i*397.39)%h;const a=(Math.sin(t*1.3+i*7)+1)*.25+.1;star(c,x,y,i%12===0?10:2.5,a,dark?'#fff':'#cbb5c9')}
 beginLayer(c,t,'main');const mainY=state.float?Math.sin(t*.8)*4:0;
 drawMainImage(c,imgs.main,mainY);endLayer(c);
 const fy=state.float?Math.sin(t*1.1)*7:0;const px=958,py=136+fy,pw=354,ph=752;
 c.save();c.shadowColor='#00000040';c.shadowBlur=17;c.shadowOffsetY=7;rr(c,px,py,pw,ph,53,'#1a191c','#8c8a8e');c.restore();photo(c,imgs.a,px+9,py+9,pw-18,ph-18,45);if(state.switch){const alpha=Math.min(1,Math.max(0,Math.sin(phase*Math.PI)*6-1.8));c.save();c.globalAlpha=alpha;photo(c,imgs.b,px+9,py+9,pw-18,ph-18,45);c.restore()}rr(c,px+126,py+20,106,25,20,'#030305');text(c,'9:41',px+29,py+40,16,'#fff','left',700);text(c,'▴ ▰',px+pw-57,py+40,16);const shade=c.createLinearGradient(0,py+400,0,py+ph);shade.addColorStop(0,'#00000000');shade.addColorStop(1,'#00000050');rr(c,px+9,py+9,pw-18,ph-18,45,shade);
 beginLayer(c,t,'phoneMusic');glass(c,px+23,py+ph-168,pw-46,75,20,dark?.19:.73);photo(c,imgs.cover,px+34,py+ph-157,53,53,10);text(c,state.song.slice(0,21),px+99,py+ph-139,14,dark?'#fff':'#493c4a','left',600);text(c,state.artist.slice(0,25),px+99,py+ph-119,11,dark?'#ddd':'#8b7c89');for(let i=0;i<5;i++){const sh=8+Math.abs(Math.sin(t*3+i))*12;rr(c,px+pw-67+i*5,py+ph-131-sh/2,3,sh,2,state.reply)}endLayer(c);rr(c,px+118,py+ph-23,120,4,3,'#ffffffbb');
 beginLayer(c,t,'quote');const qy=55+(state.float?Math.sin(t+1)*5:0),quoteLines=textLines(c,state.quote,290,18),quoteHeight=48+(quoteLines.length-1)*27;rr(c,530,qy,335,quoteHeight,Math.min(25,quoteHeight/2),state.accent);c.fillStyle=state.accent;c.beginPath();c.moveTo(550,qy+quoteHeight-15);c.lineTo(522,qy+quoteHeight+3);c.lineTo(558,qy+quoteHeight-2);c.fill();drawLines(c,quoteLines,554,qy+30,18,dark?'#fff':'#655463');endLayer(c);
 beginLayer(c,t,'messages');const cy=522;glass(c,615,cy,295,390,26,.78);rr(c,619,cy+30,41,346,12,state.accent+'40');text(c,'＋',628,cy+72,29,'#8c8291');for(let i=0;i<6;i++)photo(c,imgs[`chat${i+1}`],626,cy+95+i*43,29,29,15);text(c,'MESSAGES',680,cy+52,10,'#aaa0ad');text(c,'⌕ ⋮',860,cy+52,17,'#9e94a0');c.fillStyle='#ded6de';c.fillRect(672,cy+68,222,1);
 const lines=state.messages.split('\n').filter(Boolean).slice(0,5),conversation=messageFrame(lines,t,state.chat);
 const bubbles=conversation.items.map(item=>{const right=item.index%2,rows=textLines(c,item.text,right?152:163,11);c.font='500 11px "Noto Sans KR",sans-serif';const width=Math.max(46,Math.min(right?174:185,Math.max(...rows.map(row=>c.measureText(row).width))+22));return {...item,right,rows,width,height:28+(rows.length-1)*16.5}}),totalHeight=bubbles.reduce((sum,b)=>sum+b.height+8,0)+(conversation.typing?27:0);let bubbleY=cy+88-Math.max(0,totalHeight-248);
 c.save();c.beginPath();c.rect(669,cy+83,232,253);c.clip();
 for(const b of bubbles){const x=b.right?894-b.width:675,ease=1-(1-b.progress)**3,y=b.right?bubbleY+(cy+330-b.height-bubbleY)*(1-ease):bubbleY+7*(1-ease);c.save();c.globalAlpha*=b.right?Math.min(1,b.progress*4):ease;rr(c,x,y,b.width,b.height,13,b.right?state.reply:'#f3f0f3');drawLines(c,b.rows,x+10,y+18,11,b.right?'#51414d':'#7a6c78');c.restore();bubbleY+=b.height+8}
 if(conversation.typing){rr(c,674,bubbleY,50,27,13,'#f4f0f3');for(let dot=0;dot<3;dot++){const pulse=(Math.sin(t*9-dot*1.1)+1)/2;c.save();c.globalAlpha*=.35+.65*pulse;rr(c,686+dot*10,bubbleY+12-pulse*2,5,5,2.5,'#9f94a0');c.restore()}}
 c.restore();rr(c,674,cy+349,193,28,15,'#ffffffb0','#e1d9e0');
 c.save();c.beginPath();c.rect(683,cy+350,173,26);c.clip();
 if(conversation.draft){c.font='400 11px "Noto Sans KR",sans-serif';const width=c.measureText(conversation.draft).width,x=687-Math.max(0,width-158);text(c,conversation.draft,x,cy+368,11,'#7a6c78');if(Math.floor(t*3)%2===0){c.fillStyle=state.reply;c.fillRect(x+width+2,cy+357,1.5,13)}}else text(c,'iMessage',687,cy+368,11,'#c0b3bf');c.restore();rr(c,874,cy+352,22,22,11,state.reply);text(c,'↑',885,cy+369,18,'white','center');endLayer(c);
 beginLayer(c,t,'name');const vy=429+(state.float?Math.cos(t)*5:0);glass(c,515,vy,248,143,25,.63);['#dfb2c1','#acd5d7','#b9a9cf'].forEach((co,i)=>rr(c,531+i*15,vy+15,8,8,4,co));photo(c,imgs.profile,612,vy+27,54,54,28);c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.arc(639,vy+54,28,0,Math.PI*2);c.stroke();rr(c,525,vy+93,229,38,18,'#ffffff80','#ffffffa0');text(c,state.pair.slice(0,21),639,vy+110,14,'#655762','center',600);text(c,state.handle.slice(0,27),639,vy+124,9,'#a292a1','center');endLayer(c);
 beginLayer(c,t,'music');const my=206+(state.float?Math.sin(t+2)*7:0);c.save();c.shadowBlur=26;c.shadowColor='#30223930';rr(c,718,my,313,248,27,'#323035ed');c.restore();photo(c,imgs.cover,736,my+19,81,81,11);text(c,state.song.slice(0,19),833,my+50,18,'#fff','left',600);text(c,state.artist.slice(0,25),833,my+73,12,'#beb8c2');rr(c,736,my+123,276,4,2,'#ffffff30');rr(c,736,my+123,276*(trackPosition/trackLength),4,2,'#f0ebef');text(c,musicTime(trackPosition),736,my+146,10,'#d1c9d1');text(c,'−'+musicTime(Math.ceil(trackLength-trackPosition)),983,my+146,10,'#d1c9d1');text(c,'◀◀',780,my+186,21);text(c,playing?'Ⅱ':'▶',874,my+187,30,'#fff','center',700);text(c,'▶▶',942,my+186,21);text(c,'◖',737,my+223,18,'#b2aab4');rr(c,770,my+215,210,4,2,'#ffffff30');rr(c,770,my+215,73,4,2,'#ddd6df');text(c,'◗',991,my+223,18,'#b2aab4');endLayer(c);
 if(state.hearts)for(let i=0;i<15;i++){let x=(i*191.5+53)%w,y=(h-((t*27+i*77)%h));c.save();c.globalAlpha=.12+((i*7)%4)*.055;text(c,i%3===0?'✧':'♡',x,y,19+i%4*4,dark?'#fff':state.accent);c.restore()}
 if(state.sparkles)for(let i=0;i<9;i++)star(c,100+i*153,(i*149+250)%h,8+Math.sin(t*2+i)*4,.6,dark?'#fff':'#fff');
}
function tick(now){if(playing&&!exporting)elapsed=(elapsed+(now-last)/1000)%state.duration;last=now;render(ctx,elapsed);$('seek').value=elapsed;$('time').textContent=`00:${String(Math.floor(elapsed)).padStart(2,'0')}`;requestAnimationFrame(tick)}
function setPlay(v){playing=v;$('play').textContent=v?'Ⅱ':'▶';$('play').setAttribute('aria-label',v?'일시정지':'재생');if(v&&audio.src)audio.play().catch(()=>toast('음악을 재생할 수 없어요.'));else audio.pause()}
$('play').onclick=()=>setPlay(!playing);$('seek').oninput=e=>{elapsed=+e.target.value;setPlay(false)};
$('audioFile').onchange=async e=>{
 const f=e.target.files[0];if(!f)return;const request=++musicRequest;
 const previous={song:state.song,artist:state.artist,cover:imgs.cover};
 audio.pause();if(audio.src)URL.revokeObjectURL(audio.src);
 const player=new Audio();audio=player;player.preload='metadata';player.loop=true;
 state.trackDuration=0;sync();$('audioName').textContent=`${f.name} · 음악 정보 읽는 중…`;
 const durationTask=readMusicDuration(player);player.src=URL.createObjectURL(f);
 if(playing)player.play().catch(()=>{});
 const [tags,duration]=await Promise.all([readMusicTags(f),durationTask]);
 if(request!==musicRequest)return;
 const applied=[];for(const key of ['song','artist']){const value=tags[key==='song'?'title':'artist'];if(typeof value==='string'&&value.trim()&&state[key]===previous[key]){state[key]=value.trim().slice(0,35);applied.push(key==='song'?'제목':'아티스트')}}
 state.trackDuration=duration;if(duration)applied.push('재생시간');sync();
 const cover=musicCover(tags);if(cover){try{const src=await readFile(cover),im=await loadImage(src);if(request!==musicRequest)return;if(imgs.cover===previous.cover){sources.cover=src;imgs.cover=im;updateUploads();applied.push('앨범 커버')}}catch{ /* Keep the current cover if embedded artwork cannot be decoded. */ }}
 if(request!==musicRequest)return;
 $('audioName').textContent=`${f.name} · ${applied.length?applied.join(' · ')+' 반영 완료':'읽을 수 있는 음악 정보가 없어요.'}${duration?'':' · 재생시간 확인 불가'}${applied.length<4?' · 누락된 항목은 기존 값 유지':''}`;
 toast(applied.length?'음악 정보를 자동으로 설정했어요.':'음악 정보가 없어 기존 설정을 유지했어요.');
};
$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.querySelector('.canvas-wrap').requestFullscreen().catch(()=>toast('전체 화면을 지원하지 않는 브라우저예요.'))};
$('referenceGradient').onclick=()=>{Object.assign(state,{bgMode:'gradient',bg:'#050508',bgEnd:'#b49bc9',bgDirection:'down',bgStart:60});sync();setAssets();toast('원본 GIF처럼 아래쪽으로 번지는 배경을 적용했어요.')};
$('reset').onclick=()=>{state={...state,zoom:1,position:.5,card:true,sparkles:true,hearts:true,float:true,chat:true,switch:true,duration:6};sync();elapsed=0;toast('효과를 초기화했어요.')};

$('exportTop').onclick=()=>$('exportDialog').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
$('png').onclick=()=>{render(ctx,elapsed);canvas.toBlob(b=>{if(b){download(b,'lumi-pair.png');$('exportStatus').textContent='PNG 이미지를 저장했어요.'}},'image/png')};
$('saveProject').onclick=async()=>{const assets={};for(const [k,im] of Object.entries(imgs)){if(im.isPlaceholder){assets[k]=null;continue}const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);assets[k]=c.toDataURL('image/png')}download(new Blob([JSON.stringify({version:2,state,assets})],{type:'application/json'}),'lumi-project.json');toast('프로젝트를 저장했어요. 음악 파일은 별도 보관해주세요.')};
$('loadProject').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const p=JSON.parse(await f.text());if(![1,2].includes(p.version)||!p.state||!p.assets)throw Error();const next={...state};for(const k of keys){const v=p.state[k]??backgroundDefaults[k];if(typeof v!==typeof state[k])throw Error();next[k]=v}if(![1,2,3,4,5].includes(p.state.theme)||![6,8,12].includes(next.duration)||!Number.isFinite(next.zoom)||next.zoom<.25||next.zoom>3||next.position<0||next.position>1)throw Error();if(!['solid','gradient'].includes(next.bgMode)||!['down','up','right','left','diagonal'].includes(next.bgDirection)||!Number.isFinite(next.bgStart)||next.bgStart<0||next.bgStart>90)throw Error();for(const k of ['bg','bgEnd','accent','reply'])if(!/^#[0-9a-f]{6}$/i.test(next[k]))throw Error();const importedAssets=completeAssets(p.assets);for(const [k] of slots)if(importedAssets[k]!==null&&(typeof importedAssets[k]!=='string'||!importedAssets[k].startsWith('data:image/')))throw Error();const pairs=await Promise.all(slots.map(async([k])=>[k,importedAssets[k]===null?null:await loadImage(importedAssets[k])]));musicRequest++;audio.pause();if(audio.src)URL.revokeObjectURL(audio.src);audio=new Audio();next.trackDuration=Number.isFinite(p.state.trackDuration)&&p.state.trackDuration>0?p.state.trackDuration:0;$('audioName').textContent='프로젝트의 음악 정보가 복원됐어요. 재생하려면 음악 파일을 다시 선택해주세요.';state={...next,theme:p.state.theme};imgs=Object.fromEntries(pairs.map(([k,im])=>[k,im||placeholder(k)]));sources=Object.fromEntries(slots.map(([k])=>[k,importedAssets[k]]));sync();updateUploads();elapsed=0;toast('프로젝트를 불러왔어요.')}catch{toast('올바른 LUMI 프로젝트 파일을 선택해주세요.')}e.target.value=''};
// GIF89a encoder: adaptive median-cut palette, cached nearest colors and LZW.
let gifPalette=[],gifLookup;
function makePalette(frames){
 const hist=new Map();for(const rgba of frames)for(let i=0;i<rgba.length;i+=16){const r=rgba[i]>>3,g=rgba[i+1]>>3,b=rgba[i+2]>>3,k=(r<<10)|(g<<5)|b;hist.set(k,(hist.get(k)||0)+1)}
 const colors=[...hist].map(([k,n])=>({v:[((k>>10)&31)*8+4,((k>>5)&31)*8+4,(k&31)*8+4],n}));
 function box(items){const ranges=[0,1,2].map(c=>Math.max(...items.map(x=>x.v[c]))-Math.min(...items.map(x=>x.v[c])));const axis=ranges.indexOf(Math.max(...ranges));return {items,axis,score:ranges[axis]*Math.sqrt(items.reduce((n,x)=>n+x.n,0))}}
 let boxes=[box(colors)];while(boxes.length<256){boxes.sort((a,b)=>b.score-a.score);const b=boxes.shift();if(b.items.length<2){boxes.unshift(b);break}b.items.sort((a,c)=>a.v[b.axis]-c.v[b.axis]);const total=b.items.reduce((n,x)=>n+x.n,0);let sum=0,cut=1;for(let i=0;i<b.items.length-1;i++){sum+=b.items[i].n;cut=i+1;if(sum>=total/2)break}boxes.push(box(b.items.slice(0,cut)),box(b.items.slice(cut)))}
 gifPalette=boxes.map(b=>{const n=b.items.reduce((s,x)=>s+x.n,0);return [0,1,2].map(c=>Math.min(255,Math.round(b.items.reduce((s,x)=>s+x.v[c]*x.n,0)/n)))});while(gifPalette.length<256)gifPalette.push([0,0,0]);gifLookup=new Int16Array(32768).fill(-1);
}
function paletteIndex(r,g,b){const key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);if(gifLookup[key]>=0)return gifLookup[key];let best=0,dist=Infinity;for(let i=0;i<256;i++){const v=gifPalette[i],d=(r-v[0])**2+(g-v[1])**2+(b-v[2])**2;if(d<dist){dist=d;best=i}}gifLookup[key]=best;return best}

function gifFrame(rgba,w,h){const pixels=new Uint8Array(w*h);for(let i=0;i<pixels.length;i++){const p=i*4;pixels[i]=paletteIndex(rgba[p],rgba[p+1],rgba[p+2])}let bytes=[],acc=0,bits=0,codeSize=9,next=258,dict=new Map();function emit(code){acc|=code<<bits;bits+=codeSize;while(bits>=8){bytes.push(acc&255);acc>>>=8;bits-=8}}emit(256);let prefix=pixels[0];for(let i=1;i<pixels.length;i++){const k=prefix*256+pixels[i],found=dict.get(k);if(found!==undefined){prefix=found;continue}emit(prefix);if(next<4096){if(next===(1<<codeSize)&&codeSize<12)codeSize++;dict.set(k,next++)}else{emit(256);dict.clear();codeSize=9;next=258}prefix=pixels[i]}emit(prefix);if(next===(1<<codeSize)&&codeSize<12)codeSize++;emit(257);if(bits)bytes.push(acc&255);const blocks=[8];for(let i=0;i<bytes.length;i+=255){const chunk=bytes.slice(i,i+255);blocks.push(chunk.length,...chunk)}blocks.push(0);return new Uint8Array(blocks)}
$('gif').onclick=async()=>{if(exporting)return;exporting=true;const wasPlaying=playing;setPlay(false);$('gif').disabled=$('png').disabled=true;try{const W=708,H=492,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.scale(.5,.5);const samples=[];for(const at of [0,state.duration*.5]){render(g,at);samples.push(g.getImageData(0,0,W,H).data)}makePalette(samples);const parts=[],head=[...new TextEncoder().encode('GIF89a'),W&255,W>>8,H&255,H>>8,247,0,0];for(const color of gifPalette)head.push(...color);head.push(33,255,11,...new TextEncoder().encode('NETSCAPE2.0'),3,1,0,0,0);parts.push(new Uint8Array(head));const count=state.duration*GIF_FPS;for(let i=0;i<count;i++){render(g,i/GIF_FPS);parts.push(new Uint8Array([33,249,4,0,100/GIF_FPS,0,0,0,44,0,0,0,0,W&255,W>>8,H&255,H>>8,0]));parts.push(gifFrame(g.getImageData(0,0,W,H).data,W,H));$('exportStatus').textContent=`GIF 만드는 중… ${Math.round((i+1)/count*100)}%`;await new Promise(r=>setTimeout(r,0))}parts.push(new Uint8Array([59]));download(new Blob(parts,{type:'image/gif'}),'lumi-pair.gif');$('exportStatus').textContent='움직이는 GIF를 저장했어요.'}catch(err){$('exportStatus').textContent='GIF 저장에 실패했어요. 다시 시도해주세요.';console.error(err)}finally{exporting=false;$('gif').disabled=$('png').disabled=false;setPlay(wasPlaying)}};
sync();setAssets(3).then(()=>{last=performance.now();requestAnimationFrame(tick)});
