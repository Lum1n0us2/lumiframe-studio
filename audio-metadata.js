/* Local file metadata only; no music files are uploaded. */
function readMusicTags(file){
 return new Promise(resolve=>{
  const timer=setTimeout(()=>resolve({}),15000);
  const finish=tags=>{clearTimeout(timer);resolve(tags||{})};
  try{jsmediatags.read(file,{onSuccess:result=>finish(result.tags),onError:()=>finish({})})}catch{finish({})}
 });
}
function readMusicDuration(player){
 return new Promise(resolve=>{
  const finish=()=>{clearTimeout(timer);player.removeEventListener('loadedmetadata',finish);player.removeEventListener('error',finish);resolve(Number.isFinite(player.duration)&&player.duration>0?player.duration:0)};
  const timer=setTimeout(finish,15000);
  player.addEventListener('loadedmetadata',finish);player.addEventListener('error',finish);
  if(player.readyState>=1)finish();
 });
}
function musicCover(tags){
 const picture=tags.picture;
 if(!picture?.data?.length||picture.data.length>20*1024*1024)return null;
 const type=String(picture.format||'').toLowerCase();
 const mime=({'image/jpeg':'image/jpeg','image/jpg':'image/jpeg',jpg:'image/jpeg',jpeg:'image/jpeg','image/png':'image/png',png:'image/png','image/webp':'image/webp',webp:'image/webp'})[type];
 return mime?new Blob([new Uint8Array(picture.data)],{type:mime}):null;
}
function musicTime(seconds){const n=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}
