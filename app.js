/* 사람 사는 이야기 — site shell (editions.db via sql.js) */
let n=0;
let EDITIONS=[];
let SQLDB=null;

/* ---------- theme (auto / light / dark, persisted) ---------- */
var THEME='auto';
try{var _t=localStorage.getItem('hum-theme');if(_t==='auto'||_t==='light'||_t==='dark')THEME=_t}catch(e){}
function applyTheme(){
  document.documentElement.setAttribute('data-theme',THEME);
  document.querySelectorAll('.theme-toggle button').forEach(function(b){
    b.setAttribute('aria-pressed',String(b.dataset.themeVal===THEME));
  });
  try{localStorage.setItem('hum-theme',THEME)}catch(e){}
}
document.querySelector('.theme-toggle').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;THEME=b.dataset.themeVal;applyTheme();
});
applyTheme();

/* ---------- categories ---------- */
const CATKEY={'일':'work','관계':'rel','혼자':'alone','나이 듦':'aging','돈':'money','마음':'mind','가족':'family'};
const CATLBL={work:'일',rel:'관계',alone:'혼자',aging:'나이 듦',money:'돈',mind:'마음',family:'가족'};
const CATORD=['work','rel','alone','aging','money','mind','family'];
const CATDOTS={work:'#2f6599',rel:'#b7352d',alone:'#7551a3',aging:'#9a650d',money:'#26745b',mind:'#a34d7a',family:'#3f7d8c'};

/* ---------- db ---------- */
function rows(sql){const r=SQLDB.exec(sql);return r.length?r[0].values:[]}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function nl(v){return esc(v).replace(/\n/g,'<br>')}
function cardUid(s){var h=5381;s=String(s||'');for(var i=0;i<s.length;i++){h=(((h<<5)+h)+s.charCodeAt(i))>>>0}return 'c'+h.toString(36)}

async function loadEditions(){
  const SQL=await initSqlJs({locateFile:function(f){return f}});
  const buf=await (await fetch('editions.db')).arrayBuffer();
  if(!buf.byteLength) throw new Error('empty db');
  SQLDB=new SQL.Database(new Uint8Array(buf));
  return rows("SELECT id,kicker,date,label,small,window,cnt FROM editions ORDER BY date DESC, id DESC").map(function(e){
    const items=rows("SELECT id,edition_id,cat,title,scene,stat,stat_src,stat_year,quote_orig,quote_trans,quote_src,quote_url,analogy,question,card,shorts,flags,kind,q1,q2,q3,point,url FROM items WHERE edition_id='"+e[0].replace(/'/g,"''")+"' ORDER BY id").map(function(r){
      return {dbid:r[0],edition_id:r[1],cat:r[2],key:CATKEY[r[2]]||'work',title:r[3],scene:r[4],stat:r[5],stat_src:r[6],stat_year:r[7],quote_orig:r[8],quote_trans:r[9],quote_src:r[10],quote_url:r[11],analogy:r[12],question:r[13],card:r[14],shorts:r[15],flags:r[16],kind:r[17]||'essay',q1:r[18],q2:r[19],q3:r[20],point:r[21],url:r[22]};
    });
    return {id:e[0],kicker:e[1],date:e[2],label:e[3],small:e[4],window:e[5],cnt:e[6],items:items};
  });
}

/* 배지에는 에디션 날짜(발행일) 하나만 표기 */
function badgeDate(d){
  d=String(d==null?'':d).trim();
  const i=d.lastIndexOf('~');
  let end=i<0?d:d.slice(i+1).trim();
  const m=end.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);
  if(m) return m[1]+'.'+(+m[2])+'.'+(+m[3]);
  return end;
}
function editionShort(ed){
  const d=badgeDate(ed.date);
  return d+(ed.label?' · '+ed.label:'');
}

function editionBlockHtml(ed,count){
  const label=ed.label?esc(ed.label):esc(badgeDate(ed.date)+'의 이야기');
  const small=ed.small?'<small>'+esc(ed.small)+'</small>':'';
  return '<section class="edition-block" id="block-'+esc(ed.id)+'" aria-label="'+esc(editionShort(ed))+'">'
    +'<div class="edition-head"><h2 class="edition-title">'
    +'<span class="edition-date"><span class="d-nowrap">'+esc(badgeDate(ed.date))+'</span></span>'
    +'<span class="edition-label">'+label+small+'</span></h2>'
    +'<p><span class="window">총 '+count+'편</span><br>'
    +'복사·공유·링크·이미지 저장으로 이야기를 나눠 보세요.</p></div>'
    +'<div class="grid"></div></section>';
}

function partHtml(num,label,inner){
  return '<section class="part"><h5>'+num+' '+label+'</h5>'+inner+'</section>';
}

function discoveryCard(it,edDate){
  n++;
  const uid=cardUid(it.title+'|'+it.edition_id);
  const copyIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  const shareIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8.3 10.9 7.4-4.5M8.3 13.1l7.4 4.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  const linkIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 10a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  return '<article id="'+uid+'" class="card c-'+it.key+'" data-cat="'+it.key+'" data-edition="'+esc(it.edition_id)+'" data-url="'+esc(it.url||'')+'">'
    +'<div class="card-body">'
    +'<div class="meta"><span class="tag">'+esc(CATLBL[it.key]||it.cat)+'</span><time>'+esc(badgeDate(edDate))+'</time></div>'
    +'<h4>'+esc(it.title)+'</h4>'
    +'<section class="part"><p>'+nl(it.q1||'')+'</p><p>'+nl(it.q2||'')+'</p><p>'+nl(it.q3||'')+'</p></section>'
    +'<section class="part question"><h5>생각해볼 포인트</h5><p>'+nl(it.point||'')+'</p></section>'
    +'<div class="source"><div class="card-actions">'
    +'<a class="card-action" href="'+esc(it.url||'')+'" target="_blank" rel="noopener noreferrer">원문 보기</a>'
    +'<button class="card-action copy-card" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="카드 복사">'+copyIcon+'복사</button>'
    +'<button class="card-action share-card" type="button" aria-label="카드 공유">'+shareIcon+'공유</button>'
    +'<button class="card-action link-card" type="button" aria-label="카드 링크 복사">'+linkIcon+'링크</button>'
    +'</div><span class="index">'+String(n).padStart(2,'0')+'</span></div>'
    +'</div></article>';
}

function card(it,edDate){
  if(it.kind==='discovery') return discoveryCard(it,edDate);
  n++;
  const uid=cardUid(it.title+'|'+it.edition_id);
  const statMeta=[it.stat_src,it.stat_year?('기준연도 '+it.stat_year):''].filter(Boolean).join(' · ');
  const qlink=it.quote_url?' · <a href="'+esc(it.quote_url)+'" target="_blank" rel="noopener noreferrer">원문 확인</a>':'';
  const flags=it.flags?'<p class="flags"><strong>확인 필요</strong> '+esc(it.flags)+'</p>':'';
  const copyIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  const shareIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8.3 10.9 7.4-4.5M8.3 13.1l7.4 4.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  const linkIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 10a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const imgIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="9" r="1.5" fill="currentColor"/><path d="m5 17 4.2-4.2 3.1 3.1 2.2-2.2L19 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return '<article id="'+uid+'" class="card c-'+it.key+'" data-cat="'+it.key+'" data-edition="'+esc(it.edition_id)+'" data-url="'+esc(it.quote_url||'')+'">'
    +'<div class="card-body">'
    +'<div class="meta"><span class="tag">'+esc(CATLBL[it.key]||it.cat)+'</span><time>'+esc(badgeDate(edDate))+'</time></div>'
    +'<h4>'+esc(it.title)+'</h4>'
    +partHtml('①','장면','<p>'+nl(it.scene)+'</p>')
    +partHtml('②','숫자 하나','<p>'+nl(it.stat)+'</p>'+(statMeta?'<p class="src-line">'+esc(statMeta)+'</p>':''))
    +partHtml('③','옛사람의 한마디','<p class="quote-orig">'+nl(it.quote_orig)+'</p><p class="quote-trans">'+nl(it.quote_trans)+'</p><p class="src-line">출처: '+esc(it.quote_src||'')+qlink+'</p>')
    +partHtml('④','쉬운 비유','<p>'+nl(it.analogy)+'</p>')
    +'<section class="part question"><h5>⑤ 오늘의 질문</h5><p>'+nl(it.question)+'</p></section>'
    +flags
    +'<div class="source"><div class="card-actions">'
    +'<button class="card-action copy-card" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="카드 복사">'+copyIcon+'복사</button>'
    +'<button class="card-action share-card" type="button" aria-label="카드 공유">'+shareIcon+'공유</button>'
    +'<button class="card-action link-card" type="button" aria-label="카드 링크 복사">'+linkIcon+'링크</button>'
    +'<button class="card-action img-card" type="button" aria-label="카드 이미지 저장">'+imgIcon+'이미지</button>'
    +'</div><span class="index">'+String(n).padStart(2,'0')+'</span></div>'
    +'</div></article>';
}

function renderEditions(){
  n=0;
  const holder=document.getElementById('editions');holder.innerHTML='';
  EDITIONS.forEach(function(ed){
    const tmp=document.createElement('div');
    tmp.innerHTML=editionBlockHtml(ed,ed.items.length);
    const sec=tmp.firstChild;holder.appendChild(sec);
    const grid=sec.querySelector('.grid');
    grid.innerHTML=ed.items.map(function(it){return card(it,ed.date)}).join('');
  });
}

/* ---------- shell / counts ---------- */
function catTotals(){
  const t={};CATORD.forEach(function(k){t[k]=0});
  EDITIONS.forEach(function(ed){ed.items.forEach(function(it){t[it.key]=(t[it.key]||0)+1})});
  return t;
}
let activeEdition='all';
function refreshShell(){
  const tot=catTotals();
  const all=CATORD.reduce(function(a,k){return a+tot[k]},0);
  const snapB=document.getElementById('snap-count');
  if(snapB)snapB.textContent=all;
  const snapL=document.getElementById('snap-label');
  if(snapL)snapL.textContent=all?('모은 이야기 · '+EDITIONS.length+'개 날짜'):'이야기를 모으는 중';
  const issue=document.getElementById('issue-line');
  if(issue&&EDITIONS[0])issue.textContent='사람 사는 이야기 · '+badgeDate(EDITIONS[0].date)+' 최신';
  const map={all:'전체'};CATORD.forEach(function(k){map[k]=CATLBL[k]});
  document.querySelectorAll('.legend button').forEach(function(btn){
    const k=btn.dataset.filter;const c=k==='all'?all:(tot[k]||0);
    const dot=k==='all'?'':'<i class="dot" style="color:'+CATDOTS[k]+'"></i>';
    btn.innerHTML=dot+esc(map[k]||k)+' '+c;
  });
  const st=document.getElementById('search-status');
  if(st)st.textContent=all?('전체 '+all+'편'):'아직 글이 없습니다';
  buildEditionFilter();
}
function buildEditionFilter(){
  const sel=document.getElementById('edition-select');if(!sel)return;
  const cur=sel.value||'all';sel.innerHTML='';
  const o0=document.createElement('option');o0.value='all';o0.textContent='전체 날짜';sel.appendChild(o0);
  EDITIONS.forEach(function(ed){
    const o=document.createElement('option');o.value=ed.id;
    o.textContent=editionShort(ed)+' ('+ed.items.length+')';sel.appendChild(o);
  });
  sel.value=[...sel.options].some(function(o){return o.value===cur})?cur:'all';
  activeEdition=sel.value;
}
document.getElementById('edition-select').addEventListener('change',function(e){activeEdition=e.target.value;applyFilters(true)});

/* ---------- copy / share / link / image ---------- */
const toast=document.getElementById('toast');
const copyMenu=document.getElementById('copy-menu');
let activeCopyButton=null,activeCopyCard=null;
let toastTimer;
function showToast(m){toast.textContent=m;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){toast.classList.remove('show')},2200)}
function closeCopyMenu(restore){if(!copyMenu||copyMenu.hidden)return;copyMenu.hidden=true;if(activeCopyButton)activeCopyButton.setAttribute('aria-expanded','false');if(restore&&activeCopyButton)activeCopyButton.focus();activeCopyButton=null;activeCopyCard=null}
function openCopyMenu(button){
  if(activeCopyButton===button&&!copyMenu.hidden){closeCopyMenu(false);return}
  closeCopyMenu(false);activeCopyButton=button;activeCopyCard=button.closest('.card');button.setAttribute('aria-expanded','true');copyMenu.hidden=false;
  if(!matchMedia('(max-width: 800px)').matches){const r=button.getBoundingClientRect(),w=244;copyMenu.style.left=Math.max(10,Math.min(innerWidth-w-10,r.right-w))+'px';copyMenu.style.top=Math.min(innerHeight-copyMenu.offsetHeight-10,r.bottom+8)+'px'}
  requestAnimationFrame(function(){const first=copyMenu.querySelector('.copy-choice');if(first)first.focus()});
}
function fallbackCopy(text){const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();return ok}
function copyText(text){if(navigator.clipboard&&navigator.clipboard.writeText){return navigator.clipboard.writeText(text).catch(function(){if(!fallbackCopy(text))throw new Error('copy failed')})}return Promise.resolve(fallbackCopy(text)).then(function(ok){if(!ok)throw new Error('copy failed')})}

function cardData(article){
  const it={
    title:article.querySelector('h4').textContent.trim(),
    meta:Array.from(article.querySelectorAll('.meta .tag,.meta time')).map(function(el){return el.textContent.trim()}).join(' · ')
  };
  it.parts=Array.from(article.querySelectorAll('.part')).map(function(p){
    const h=p.querySelector('h5');
    return {head:h?h.textContent.trim():'',
      body:Array.from(p.querySelectorAll('p')).map(function(x){return x.textContent.trim()}).join('\n')};
  });
  const f=article.querySelector('.flags');
  it.flags=f?f.textContent.trim():'';
  return it;
}
function cardText(article){
  const d=cardData(article);
  const lines=[d.title,'['+d.meta+']',''];
  d.parts.forEach(function(p){if(p.head)lines.push(p.head,'');lines.push(p.body,'')});
  if(d.flags)lines.push(d.flags,'');
  const src=article.dataset.url;
  if(src)lines.push('원문: '+src,'');
  lines.push('카드 링크: '+location.origin+location.pathname+'#'+article.id);
  return lines.join('\n');
}
function safeFileName(article){return article.querySelector('h4').textContent.trim().replace(/[\\/:*?"<>|]/g,'').slice(0,55)||'story-card'}
function downloadBlob(blob,name){const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name+'.png';document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(link.href)},1000)}

/* canvas 텍스트 줄바꿈 (한글 1자 단위) */
function canvasLines(ctx,text,maxWidth){
  const lines=[];let line='';
  Array.from(String(text)).forEach(function(ch){const test=line+ch;if(line&&ctx.measureText(test).width>maxWidth){lines.push(line.trim());line=ch.trimStart()}else{line=test}});
  if(line.trim())lines.push(line.trim());return lines;
}
function drawLines(ctx,lines,x,y,lh){lines.forEach(function(l){ctx.fillText(l,x,y);y+=lh});return y}

function renderCardPng(article){
  return Promise.resolve(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){
    const W=1200,side=76,max=W-side*2;
    const work=document.createElement('canvas');work.width=W;work.height=3200;
    const ctx=work.getContext('2d');
    const bodyStyle=getComputedStyle(document.body);
    const ink=bodyStyle.color,bg=getComputedStyle(article).backgroundColor;
    const cat=getComputedStyle(article).borderTopColor;
    const soft=getComputedStyle(article.querySelector('.part.question')).backgroundColor;
    const muted=getComputedStyle(article.querySelector('.meta')).color;
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,work.height);
    ctx.fillStyle=cat;ctx.fillRect(0,0,W,16);let y=16+68;
    const d=cardData(article);
    /* 태그 + 날짜 */
    const tag=d.meta.split(' · ')[0]||'';
    ctx.font='700 25px "Noto Sans KR", sans-serif';
    const tagW=Math.ceil(ctx.measureText(tag).width)+34;
    ctx.fillStyle=soft;ctx.fillRect(side,y-30,tagW,44);
    ctx.fillStyle=cat;ctx.fillText(tag,side+17,y);
    ctx.fillStyle=muted;ctx.font='600 23px "Noto Sans KR", sans-serif';
    ctx.fillText(d.meta.split(' · ').slice(1).join(' · '),side+tagW+18,y);
    y+=72;
    /* 제목 */
    ctx.fillStyle=ink;ctx.font='800 50px "Noto Sans KR", sans-serif';
    y=drawLines(ctx,canvasLines(ctx,d.title,max),side,y,70);y+=30;
    /* 5칸 */
    d.parts.forEach(function(p){
      ctx.font='800 27px "Noto Sans KR", sans-serif';ctx.fillStyle=cat;
      const headLines=canvasLines(ctx,p.head,max);
      y=drawLines(ctx,headLines,side,y,40);y+=10;
      p.body.split('\n').forEach(function(para){
        if(!para.trim())return;
        const isOrig=/^[一-鿿、。；：？！「」『』·…—―\s]+$/.test(para.replace(/[a-zA-Z0-9]/g,''))&&para.length<400&&/[一-鿿]/.test(para);
        if(isOrig){ctx.font='400 33px "Gowun Batang", serif'}
        else if(/^출처/.test(para)){ctx.font='500 24px "Noto Sans KR", sans-serif'}
        else{ctx.font='400 31px "Gowun Dodum", "Noto Sans KR", sans-serif'}
        ctx.fillStyle=/^출처/.test(para)?muted:ink;
        y=drawLines(ctx,canvasLines(ctx,para,max),side,y,isOrig?50:(/^출처/.test(para)?38:47));y+=12;
      });
      y+=14;
    });
    if(d.flags){
      ctx.font='700 25px "Noto Sans KR", sans-serif';
      const fl=canvasLines(ctx,d.flags,max-40);
      const fh=fl.length*40+40;
      ctx.strokeStyle=cat;ctx.setLineDash([10,8]);ctx.lineWidth=2;
      ctx.strokeRect(side,y,max,fh);ctx.setLineDash([]);
      ctx.fillStyle=muted;y=drawLines(ctx,fl,side+20,y+36,40);y+=24;
    }
    /* 푸터 */
    ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--line').trim()||muted;
    ctx.fillRect(side,y,max,2);y+=44;
    ctx.font='700 22px "Noto Sans KR", sans-serif';ctx.fillStyle=muted;ctx.textAlign='right';
    ctx.fillText('사람 사는 이야기',W-side,y);ctx.textAlign='left';y+=56;
    const out=document.createElement('canvas');out.width=W;out.height=Math.min(work.height,Math.ceil(y));
    out.getContext('2d').drawImage(work,0,0,W,out.height,0,0,W,out.height);
    return new Promise(function(res,rej){out.toBlob(function(b){b?res(b):rej(new Error('image failed'))},'image/png')});
  });
}

function copyCardImage(article){
  const png=renderCardPng(article);
  if(navigator.clipboard&&navigator.clipboard.write&&window.ClipboardItem){
    return navigator.clipboard.write([new ClipboardItem({'image/png':png})]).then(function(){return 'copied'});
  }
  return png.then(function(blob){downloadBlob(blob,safeFileName(article));return 'downloaded'});
}

function updateShareButtons(){
  const mobile=matchMedia('(max-width: 800px)').matches;
  document.querySelectorAll('.share-card').forEach(function(b){b.classList.toggle('available',mobile)});
}
updateShareButtons();
window.addEventListener('resize',updateShareButtons);

document.addEventListener('click',function(event){
  const button=event.target.closest('.card-action');if(!button)return;
  const article=button.closest('.card');if(!article)return;
  const title=article.querySelector('h4').textContent.trim();
  if(button.classList.contains('copy-card')){
    openCopyMenu(button);
    return;
  }
  if(button.classList.contains('link-card')){
    copyText(location.origin+location.pathname+'#'+article.id).then(function(){showToast('카드 링크를 복사했어요.')}).catch(function(){showToast('복사하지 못했어요. 다시 시도해 주세요.')});
    return;
  }
  if(button.classList.contains('share-card')){
    if(navigator.share){
      navigator.share({title:title,text:cardText(article)}).then(function(){showToast('공유했어요.')}).catch(function(err){if(err&&err.name!=='AbortError')showToast('공유하지 못했어요. 다시 시도해 주세요.')});
    }else{
      copyText(cardText(article)).then(function(){showToast('공유할 내용을 복사했어요.')}).catch(function(){showToast('공유 기능을 사용할 수 없어요.')});
    }
    return;
  }
  if(button.classList.contains('img-card')){
    showToast('카드 이미지를 만들고 있어요…');
    copyCardImage(article).then(function(r){showToast(r==='copied'?'카드 이미지를 복사했어요.':'이미지 복사를 지원하지 않아 PNG로 저장했어요.')}).catch(function(){showToast('이미지를 만들지 못했어요. 다시 시도해 주세요.')});
  }
});

copyMenu.addEventListener('click',function(event){
  const choice=event.target.closest('.copy-choice');if(!choice||!activeCopyCard)return;const card=activeCopyCard;
  if(choice.dataset.copyMode==='text'){copyText(cardText(card)).then(function(){showToast('카드 텍스트를 복사했어요.')}).catch(function(){showToast('복사하지 못했어요. 다시 시도해 주세요.')});closeCopyMenu(false);return}
  showToast('카드 이미지를 만들고 있어요…');closeCopyMenu(false);
  copyCardImage(card).then(function(r){showToast(r==='copied'?'카드 이미지를 복사했어요.':'이미지 복사를 지원하지 않아 PNG로 저장했어요.')}).catch(function(){showToast('이미지를 만들지 못했어요. 다시 시도해 주세요.')});
});
document.addEventListener('keydown',function(event){if(event.key==='Escape'&&copyMenu&&!copyMenu.hidden)closeCopyMenu(true)});

/* ---------- search / filter ---------- */
const searchInput=document.getElementById('story-search');
const clearButton=document.getElementById('search-clear');
const searchStatus=document.getElementById('search-status');
const emptyState=document.getElementById('empty');
let activeFilter='all';
function normalise(v){return String(v).trim().toLocaleLowerCase('ko-KR')}
function applyFilters(shouldScroll){
  const query=normalise(searchInput.value);let visibleCount=0;
  document.querySelectorAll('.edition-block').forEach(function(blk){
    const editionMatch=activeEdition==='all'||blk.id==='block-'+activeEdition;
    let blockCount=0;
    blk.querySelectorAll('.card').forEach(function(item){
      const catMatch=activeFilter==='all'||item.dataset.cat===activeFilter;
      const queryMatch=!query||normalise(item.textContent).includes(query);
      const vis=catMatch&&queryMatch&&editionMatch;
      item.classList.toggle('search-hidden',!vis);
      if(vis)blockCount++;
    });
    blk.classList.toggle('search-hidden',!editionMatch||blockCount===0);
    if(editionMatch)visibleCount+=blockCount;
  });
  clearButton.hidden=!query;
  const catBtn=document.querySelector('.legend button[aria-pressed="true"]');
  const catLabel=catBtn?catBtn.textContent.trim().replace(/\s+\d+$/,''):'전체';
  const edSuffix=activeEdition==='all'?'':' · '+editionShort(EDITIONS.find(function(e){return e.id===activeEdition})||{date:'',label:''});
  searchStatus.textContent=query?('“'+searchInput.value.trim()+'” 검색 결과 '+visibleCount+'편 · '+catLabel+edSuffix):('전체 '+visibleCount+'편'+edSuffix);
  const hasCards=EDITIONS.length>0;
  emptyState.innerHTML=hasCards
    ?(query?('“'+esc(searchInput.value.trim())+'” 검색 결과가 없습니다.'):'선택한 카테고리에 글이 없습니다.')
    :'아직 글이 없습니다.<br>첫 이야기가 곧 올라옵니다.';
  emptyState.classList.toggle('show',visibleCount===0);
  if(shouldScroll&&visibleCount){
    const first=document.querySelector('.edition-block:not(.search-hidden) .card:not(.search-hidden)');
    if(first)first.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
}
document.querySelectorAll('.legend button').forEach(function(btn){
  btn.addEventListener('click',function(){
    activeFilter=btn.dataset.filter;
    document.querySelectorAll('.legend button').forEach(function(b){b.setAttribute('aria-pressed',String(b===btn))});
    applyFilters(activeFilter!=='all');
  });
});
searchInput.addEventListener('input',function(){applyFilters(false)});
searchInput.addEventListener('keydown',function(e){if(e.key==='Escape'&&searchInput.value){searchInput.value='';applyFilters(false)}});
clearButton.addEventListener('click',function(){searchInput.value='';applyFilters(false);searchInput.focus()});

/* ---------- deep link ---------- */
function handleDeepLink(){
  const h=(location.hash||'').replace('#','');if(!h)return;
  const el=document.getElementById(h);
  if(!el||!el.classList.contains('card'))return;
  const eid=el.dataset.edition;
  const sel=document.getElementById('edition-select');
  if(eid&&sel&&sel.querySelector('option[value="'+eid+'"]')){sel.value=eid;activeEdition=eid;applyFilters(false)}
  setTimeout(function(){
    try{el.scrollIntoView({block:'center'})}catch(e){el.scrollIntoView()}
    el.classList.add('flash');setTimeout(function(){el.classList.remove('flash')},2800);
  },450);
}

/* ---------- main ---------- */
async function main(){
  try{EDITIONS=await loadEditions()}
  catch(e){
    document.getElementById('editions').innerHTML='';
    emptyState.innerHTML='이야기를 불러오지 못했어요.<br>새로고침해 주세요.';
    emptyState.classList.add('show');
    searchStatus.textContent='불러오기 실패';
    return;
  }
  refreshShell();
  renderEditions();
  applyFilters(false);
  handleDeepLink();
}
main();
