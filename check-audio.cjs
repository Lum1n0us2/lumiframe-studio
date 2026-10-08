const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const jsmediatags=require('./vendor/jsmediatags.min.js');
const sandbox={jsmediatags,Blob,Uint8Array,setTimeout,clearTimeout,Number};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/audio-metadata.js','utf8'),sandbox);
function frame(id,data){const head=Buffer.alloc(10);head.write(id);head.writeUInt32BE(data.length,4);return Buffer.concat([head,data])}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jwXkAAAAASUVORK5CYII=','base64');
const txt=s=>Buffer.concat([Buffer.from([1,255,254]),Buffer.from(s,'utf16le')]);
const body=Buffer.concat([frame('TIT2',txt('우리의 노래')),frame('TPE1',txt('테스트 아티스트')),frame('APIC',Buffer.concat([Buffer.from([0]),Buffer.from('image/png\0'),Buffer.from([3,0]),png]))]);
const head=Buffer.from([73,68,51,3,0,0,(body.length>>21)&127,(body.length>>14)&127,(body.length>>7)&127,body.length&127]);
(async()=>{
 const tags=await sandbox.readMusicTags([...Buffer.concat([head,body,Buffer.alloc(256)])]);
 assert.equal(tags.title,'우리의 노래');assert.equal(tags.artist,'테스트 아티스트');
 const cover=sandbox.musicCover(tags);assert.equal(cover.type,'image/png');assert.deepEqual(Buffer.from(await cover.arrayBuffer()),png);
 assert.equal(sandbox.musicCover({}),null);assert.equal(sandbox.musicCover({picture:{format:'text/html',data:[1]}}),null);
 assert.equal(Object.keys(await sandbox.readMusicTags(Array(256).fill(0))).length,0);
 class Player extends EventTarget {duration=0;readyState=0}
 const player=new Player(),pending=sandbox.readMusicDuration(player);player.duration=193.8;player.dispatchEvent(new Event('loadedmetadata'));assert.equal(await pending,193.8);assert.equal(sandbox.musicTime(193.8),'3:13');
 const bad=new Player(),failed=sandbox.readMusicDuration(bad);bad.dispatchEvent(new Event('error'));assert.equal(await failed,0);
 const elements={audioFile:{},audioName:{}};sandbox.$=id=>elements[id];sandbox.state={song:'기존 제목',artist:'기존 가수'};sandbox.imgs={cover:{existing:true}};sandbox.sources={};sandbox.musicRequest=0;sandbox.playing=false;sandbox.audio={pause(){}};
 sandbox.Audio=class{pause(){} play(){return Promise.resolve()}};sandbox.URL={createObjectURL:()=> 'blob:test',revokeObjectURL(){}};
 sandbox.sync=()=>{};sandbox.updateUploads=()=>{};sandbox.toast=()=>{};sandbox.readMusicDuration=async()=>193.8;sandbox.readFile=async()=> 'data:image/png;base64,test';sandbox.loadImage=async()=>({decoded:true});
 sandbox.readMusicTags=async()=>tags;
 const app=fs.readFileSync(__dirname+'/app.js','utf8');vm.runInContext(app.slice(app.indexOf("$('audioFile').onchange="),app.indexOf("$('fullscreen')")),sandbox);
 await elements.audioFile.onchange({target:{files:[{name:'test.mp3'}]}});
 assert.equal(sandbox.state.song,'우리의 노래');assert.equal(sandbox.state.artist,'테스트 아티스트');assert.equal(sandbox.state.trackDuration,193.8);assert(sandbox.imgs.cover.decoded);
 sandbox.readMusicTags=async()=>({});await elements.audioFile.onchange({target:{files:[{name:'no-tags.wav'}]}});assert.equal(sandbox.state.song,'우리의 노래');assert(sandbox.imgs.cover.decoded);
 let finish;sandbox.readMusicTags=()=>new Promise(resolve=>finish=resolve);const old=elements.audioFile.onchange({target:{files:[{name:'slow.mp3'}]}});sandbox.readMusicTags=async()=>({title:'최신 곡'});await elements.audioFile.onchange({target:{files:[{name:'new.mp3'}]}});finish({title:'이전 곡'});await old;assert.equal(sandbox.state.song,'최신 곡');
 sandbox.readMusicTags=()=>new Promise(resolve=>finish=resolve);const edited=elements.audioFile.onchange({target:{files:[{name:'edit.mp3'}]}});sandbox.state.song='직접 수정';finish({title:'자동 제목'});await edited;assert.equal(sandbox.state.song,'직접 수정');
 console.log('PASS: real ID3 Korean title/artist and embedded PNG parsing, missing tags, duration/error, form application, cover replacement, rapid selection and manual-edit protection.');
})().catch(e=>{console.error(e);process.exitCode=1});
