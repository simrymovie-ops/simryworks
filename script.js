(()=>{
'use strict';
const D=window.SITE_DATA||{},$=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function yid(url){
  if(!url)return'';
  try{
    const u=new URL(url,location.href),h=u.hostname.replace(/^www\./,'');
    if(h==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||'';
    if(h.endsWith('youtube.com')||h.endsWith('youtube-nocookie.com')){
      if(u.pathname==='/watch')return u.searchParams.get('v')||'';
      const p=u.pathname.split('/').filter(Boolean),i=p.findIndex(x=>['shorts','embed','live'].includes(x));
      return i>=0?(p[i+1]||''):'';
    }
  }catch(_){return''}
  return'';
}
function thumb(x){return(x.thumbnail||'').trim()||(yid(x.url)?`https://i.ytimg.com/vi/${yid(x.url)}/maxresdefault.jpg`:'')}
function fallback(img,url){img.addEventListener('error',()=>{if(img.dataset.fb)return;const id=yid(url);if(id){img.dataset.fb='1';img.src=`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}})}
function migrate(){
  D.site=D.site||{};D.site.worksSortMode=D.site.worksSortMode||'manual';D.site.dateGrouping=D.site.dateGrouping||'none';
  D.categories=Array.isArray(D.categories)?D.categories:[];D.styles=Array.isArray(D.styles)?D.styles:[];
  (D.works||[]).forEach(w=>{
    if(!Array.isArray(w.categoryIds)){const old=w.category,c=D.categories.find(x=>x.name===old);w.categoryIds=c?[c.id]:[]}
    if(!Array.isArray(w.styleIds))w.styleIds=[];
    w.publishedAt=w.publishedAt||'';w.publishedDate=w.publishedDate||'';
  });
}
migrate();

const catName=id=>D.categories.find(c=>c.id===id)?.name||'';
const styleName=id=>D.styles.find(s=>s.id===id)?.name||'';
const workCats=w=>(w.categoryIds||[]).map(catName).filter(Boolean);
const workStyles=w=>(w.styleIds||[]).map(styleName).filter(Boolean);
function dateKey(w){
  if(w.publishedAt){const t=Date.parse(w.publishedAt);if(!Number.isNaN(t))return t}
  if(w.publishedDate){const t=Date.parse(`${w.publishedDate}T00:00:00+09:00`);if(!Number.isNaN(t))return t}
  if(w.year){const t=Date.parse(`${w.year}-01-01T00:00:00+09:00`);if(!Number.isNaN(t))return t}
  return 0;
}
function sortWorks(list,mode){
  if(!mode||mode==='manual')return [...list];
  const dir=mode==='youtube-oldest'?1:-1;
  return [...list].sort((a,b)=>{const da=dateKey(a),db=dateKey(b);return da===db?0:(da-db)*dir});
}
function displayDate(w){return w.publishedDate?w.publishedDate.replaceAll('-','.'):w.year||''}
function dateBucket(w,mode){
  const d=w.publishedDate||'';
  if(mode==='year')return d?d.slice(0,4):(w.year||'');
  if(mode==='month')return d&&d.length>=7?d.slice(0,7):'';
  return'';
}
function dateBucketLabel(bucket,mode){if(mode==='month'){const[y,m]=bucket.split('-');return y&&m?`${y}/${m}`:bucket}return bucket}

function isShortWork(w){
  const ids=(w.categoryIds||[]).map(x=>String(x).toLowerCase());
  if(ids.includes('shorts')||ids.includes('short'))return true;
  return workCats(w).some(name=>/^shorts?$/i.test(String(name).trim()));
}
function card(w){
  const short=isShortWork(w);
  const a=document.createElement('a');
  a.className=`work-card${short?' work-card--shorts':''}`;
  a.href=`work-detail.html?id=${encodeURIComponent(w.id)}`;
  a.setAttribute('aria-label',`${w.title||'work'} の詳細を見る`);
  const m=document.createElement('div');
  m.className=`work-image${short?' work-image--shorts':''}`;
  const src=thumb(w);
  if(src&&short){
    const bg=new Image();bg.src=src;bg.alt='';bg.loading='lazy';bg.className='work-short-bg';bg.draggable=false;bg.setAttribute('aria-hidden','true');fallback(bg,w.url||'');
    const stage=document.createElement('div');stage.className='work-short-stage';
    const i=new Image();i.src=src;i.alt=w.title||'work';i.loading='lazy';i.className='work-short-main';i.draggable=false;fallback(i,w.url||'');
    stage.appendChild(i);m.append(bg,stage);
  }else if(src){
    const i=new Image();i.src=src;i.alt=w.title||'work';i.loading='lazy';i.draggable=false;fallback(i,w.url||'');m.appendChild(i);
  }
  const meta=document.createElement('div');meta.className='work-meta';
  meta.innerHTML=`<h3>${esc(w.title||'Untitled')}</h3>`;
  a.append(m,meta);return a;
}
async function youtubeTitle(url){
  if(!yid(url))return'';
  const targets=[`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,`https://noembed.com/embed?url=${encodeURIComponent(url)}`];
  for(const endpoint of targets){
    try{const r=await fetch(endpoint,{cache:'no-store'});if(r.ok){const d=await r.json();if(d&&d.title)return String(d.title).trim()}}catch(_){ }
  }
  return'';
}

function site(){
  const s=D.site||{};
  if($('#availability'))$('#availability').textContent=s.availability||'';
  if($('#site-description'))$('#site-description').textContent=s.description||'';
  if($('#home-about'))$('#home-about').textContent=s.about||'';
  if($('#about-text'))$('#about-text').textContent=s.about||'';
  if($('#profile-image')&&s.profileImage)$('#profile-image').src=s.profileImage;
  if($('#home-profile-image')&&s.profileImage)$('#home-profile-image').src=s.profileImage;
  if($('#home-tools'))$('#home-tools').innerHTML=(s.tools||[]).map(x=>`<span>${esc(x)}</span>`).join('');
  if($('#about-tools'))$('#about-tools').innerHTML=(s.tools||[]).map(esc).join('<br>');
  [['#footer-x',s.xUrl],['#about-x',s.xUrl]].forEach(([q,u])=>{const a=$(q);if(a&&u)a.href=u});
  [['#footer-mail',s.email],['#about-mail',s.email]].forEach(([q,m])=>{const a=$(q);if(a&&m)a.href=`mailto:${m}`});
}

function works(){
  const raw=(D.works||[]).filter(w=>w.published!==false),sortMode=D.site?.worksSortMode||'manual';
  const all=sortWorks(raw,sortMode);
  const home=$('#home-works');
  if(home){home.innerHTML='';sortWorks(raw.filter(w=>w.featured!==false),sortMode).slice(0,8).forEach(w=>home.appendChild(card(w)))}

  const grid=$('#works-grid');if(!grid)return;
  const empty=$('#works-empty'),genreHost=$('#genre-filters'),styleHost=$('#style-filters'),styleGroup=$('#style-group'),dateGroup=$('#date-group'),dateLabel=$('#date-filter-label'),dateButton=$('#date-filter-button'),dateValue=$('#date-filter-value'),dateMenu=$('#date-filter-menu');
  const state={category:'all',style:'all',date:'all'};

  function applicableStyles(){
    if(state.category==='all')return[];
    return D.styles.filter(s=>s.categoryId===state.category);
  }
  function filtered(){
    let list=raw;
    if(state.category!=='all')list=list.filter(w=>(w.categoryIds||[]).includes(state.category));
    if(state.style!=='all')list=list.filter(w=>(w.styleIds||[]).includes(state.style));
    if(state.date!=='all')list=list.filter(w=>dateBucket(w,D.site?.dateGrouping||'none')===state.date);
    return sortWorks(list,sortMode);
  }
  function updateUrl(){
    const u=new URL(location.href);
    ['category','style','date'].forEach(k=>u.searchParams.delete(k));
    if(state.category!=='all')u.searchParams.set('category',state.category);
    if(state.style!=='all')u.searchParams.set('style',state.style);
    if(state.date!=='all')u.searchParams.set('date',state.date);
    history.replaceState(null,'',u);
  }
  function render(){
    grid.innerHTML='';const list=filtered();list.forEach(w=>grid.appendChild(card(w)));if(empty)empty.hidden=list.length>0;updateUrl();
  }
  function setActive(host,key,value){$$('.filter',host).forEach(b=>b.classList.toggle('active',b.dataset[key]===value))}
  function rebuildStyles(){
    if(!styleHost||!styleGroup)return;
    const styles=applicableStyles();styleHost.innerHTML='';
    if(!styles.length){styleGroup.hidden=true;state.style='all';return}
    styleGroup.hidden=false;
    const allBtn=document.createElement('button');allBtn.className='filter';allBtn.dataset.style='all';allBtn.textContent='すべて';allBtn.onclick=()=>{state.style='all';setActive(styleHost,'style','all');render()};styleHost.appendChild(allBtn);
    styles.forEach(s=>{const b=document.createElement('button');b.className='filter';b.dataset.style=s.id;b.textContent=s.name;b.onclick=()=>{state.style=s.id;setActive(styleHost,'style',s.id);render()};styleHost.appendChild(b)});
    if(!styles.some(s=>s.id===state.style))state.style='all';
    setActive(styleHost,'style',state.style);
  }
  if(genreHost){
    genreHost.innerHTML='';
    const allBtn=document.createElement('button');allBtn.className='filter';allBtn.dataset.category='all';allBtn.textContent='ALL';allBtn.onclick=()=>{state.category='all';state.style='all';setActive(genreHost,'category','all');rebuildStyles();render()};genreHost.appendChild(allBtn);
    D.categories.forEach(c=>{const b=document.createElement('button');b.className='filter';b.dataset.category=c.id;b.textContent=c.name;b.onclick=()=>{state.category=c.id;state.style='all';setActive(genreHost,'category',c.id);rebuildStyles();render()};genreHost.appendChild(b)});
  }
  const grouping=D.site?.dateGrouping||'none';
  let dateBuckets=[];
  const closeDateMenu=()=>{if(!dateButton||!dateMenu)return;dateButton.setAttribute('aria-expanded','false');dateMenu.hidden=true};
  const openDateMenu=()=>{if(!dateButton||!dateMenu)return;dateButton.setAttribute('aria-expanded','true');dateMenu.hidden=false};
  const syncDateControl=()=>{
    if(dateValue)dateValue.textContent=state.date==='all'?'ALL':dateBucketLabel(state.date,grouping);
    if(dateMenu)$$('.filter-date-option',dateMenu).forEach(b=>{const active=b.dataset.date===state.date;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false')});
  };
  if(dateButton&&dateMenu&&dateGroup&&grouping!=='none'){
    dateBuckets=[...new Set(raw.map(w=>dateBucket(w,grouping)).filter(Boolean))].sort((a,b)=>b.localeCompare(a,'ja'));
    if(dateBuckets.length){
      dateGroup.hidden=false;
      if(dateLabel)dateLabel.textContent=grouping==='month'?'DATE':'YEAR';
      dateButton.setAttribute('aria-label',grouping==='month'?'年月で絞り込む':'年で絞り込む');
      dateMenu.innerHTML='';
      const addDateOption=(value,label)=>{
        const b=document.createElement('button');b.type='button';b.className='filter-date-option';b.dataset.date=value;b.setAttribute('role','option');b.textContent=label;
        b.onclick=()=>{state.date=value;syncDateControl();closeDateMenu();render()};
        dateMenu.appendChild(b);
      };
      addDateOption('all','ALL');
      dateBuckets.forEach(bucket=>addDateOption(bucket,dateBucketLabel(bucket,grouping)));
      dateButton.addEventListener('click',e=>{e.stopPropagation();dateMenu.hidden?openDateMenu():closeDateMenu()});
      dateMenu.addEventListener('click',e=>e.stopPropagation());
      document.addEventListener('click',closeDateMenu);
      document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDateMenu()});
    }else dateGroup.hidden=true;
  }else if(dateGroup)dateGroup.hidden=true;

  const q=new URLSearchParams(location.search),qCat=q.get('category'),qStyle=q.get('style'),qDate=q.get('date');
  if(qCat&&D.categories.some(c=>c.id===qCat))state.category=qCat;
  if(qDate&&dateBuckets.includes(qDate))state.date=qDate;
  rebuildStyles();
  if(qStyle&&D.styles.some(s=>s.id===qStyle&&s.categoryId===state.category))state.style=qStyle;
  rebuildStyles();
  setActive(genreHost,'category',state.category);
  syncDateControl();
  render();
}

function detail(){
  const h=$('#work-detail');if(!h)return;
  const id=new URLSearchParams(location.search).get('id'),w=(D.works||[]).find(x=>x.id===id&&x.published!==false);
  if(!w){h.innerHTML='<p class="empty">作品が見つかりません。</p>';return}
  document.title=w.title||'work';
  const yt=yid(w.url||''),src=thumb(w),media=yt?`<div class="detail-media"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}" title="${esc(w.title)}" loading="lazy" allowfullscreen></iframe></div>`:src?`<div class="detail-media"><img src="${esc(src)}" alt="${esc(w.title)}"></div>`:'<div class="detail-media"></div>';
  const cats=workCats(w).join(' / ')||'Other',styles=workStyles(w).join(' / '),date=displayDate(w),sub=[cats,styles].filter(Boolean).join(' / ');
  h.innerHTML=`${media}<div class="detail-head"><div><p class="detail-category">${esc(sub)}</p><h1 id="work-page-title">${esc(w.title||'Untitled')}</h1></div><dl class="detail-data">${w.client?`<div><dt>Client</dt><dd>${esc(w.client)}</dd></div>`:''}${w.role?`<div><dt>Role</dt><dd>${esc(w.role)}</dd></div>`:''}${date?`<div><dt>Date</dt><dd>${esc(date)}</dd></div>`:''}${w.url?`<div><dt>Link</dt><dd><a class="detail-action-link" href="${esc(w.url)}" target="_blank" rel="noopener noreferrer">作品を開く</a></dd></div>`:''}</dl></div>${w.description?`<p class="detail-desc">${esc(w.description)}</p>`:''}`;
  if(yt){youtubeTitle(w.url).then(t=>{if(t){document.title=t;const el=$('#work-page-title');if(el)el.textContent=t}})}
}
function services(){
  const hs=$('#home-services');
  if(hs){
    hs.innerHTML='';
    (D.services||[]).filter(s=>s.homeFeatured===true).slice(0,4).forEach((s,i)=>{
      const a=document.createElement('a');a.className='price-row';a.href='price.html';
      a.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span><h3>${esc(s.name)}</h3><p>${esc(s.description||'')}</p><strong>${esc(s.price||'')}</strong>`;
      hs.appendChild(a)
    })
  }
  const list=$('#services-list');
  if(list){
    list.innerHTML='';
    (D.services||[]).forEach(s=>{
      const el=document.createElement('article');el.className='service-item';
      const yt=yid(s.url||''),src=thumb(s),media=yt
        ?`<div class="service-media"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}" title="${esc(s.name)}" loading="lazy" allowfullscreen></iframe></div>`
        :(src?`<div class="service-media"><img src="${esc(src)}" alt="${esc(s.name)}"></div>`:'<div class="service-media service-media-empty"></div>');
      const notes=String(s.note||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join('');
      el.innerHTML=`${media}<div class="service-copy"><h2>${esc(s.name)}</h2><p>${esc(s.description||'')}</p><p class="duration">納品目安：${esc(s.duration||'要相談')}</p>${notes?`<ul class="service-notes">${notes}</ul>`:''}${s.url?`<a class="movie-link detail-action-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">YouTubeで見る</a>`:''}</div><div class="price">${esc(s.price||'')}</div>`;
      const im=$('img',el);if(im)fallback(im,s.url||'');list.appendChild(el)
    })
  }
}
function flow(){
  const detailItems=(D.flow||[]).slice(0,10);

  const homeItems=[
    {
      no:'01',
      title:'ヒアリング',
      text:'制作内容・ご予算・納期・参考映像などを確認します。'
    },
    {
      no:'02',
      title:'制作',
      text:'素材を受領後、内容に合わせて映像制作を進めます。'
    },
    {
      no:'03',
      title:'初稿',
      text:'一度ご確認いただき、必要な修正内容を反映します。'
    },
    {
      no:'04',
      title:'完成版納品',
      text:'最終確認後、ご指定の形式で完成データを納品します。'
    }
  ];

  function makeItem(x,index,compact=false){
    const item=document.createElement('article');
    item.className='flow-v-item';
    const no=String(index+1).padStart(2,'0');

    item.innerHTML=`
      <div class="flow-v-step">
        <span>${no}</span>
      </div>
      <div class="flow-v-content">
        <h3>${esc(x.title||'')}</h3>
        <p>${esc(x.text||'')}</p>
      </div>`;

    if(compact)item.classList.add('flow-v-item--compact');
    return item;
  }

  function mount(selector,items,compact=false){
    const root=$(selector);
    if(!root)return;
    root.innerHTML='';
    items.forEach((x,i)=>root.appendChild(makeItem(x,i,compact)));
  }

  mount('#home-flow',homeItems,true);
  mount('#flow-list',detailItems,false);
}
function contact(){
  const f=$('#contact-form');if(!f)return;
  const button=f.querySelector('button[type="submit"]'),buttonLabel=button?.querySelector('span'),status=$('#contact-status');
  const setStatus=(text,state='')=>{if(!status)return;status.textContent=text;status.dataset.state=state};
  f.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!f.reportValidity())return;
    const d=new FormData(f),mail=D.site?.email||'simrymovie@gmail.com',name=String(d.get('name')||'').trim(),replyTo=String(d.get('reply_to')||'').trim();
    const subject=`ホームページからのお問い合わせ：${name||'お名前未入力'}`;
    const payload={
      _subject:subject,
      _template:'table',
      name,
      company:String(d.get('company')||'').trim(),
      contact:replyTo,
      budget:String(d.get('budget')||'').trim(),
      deadline:String(d.get('deadline')||'').trim(),
      reference:String(d.get('site')||'').trim(),
      message:String(d.get('message')||'').trim()
    };
    if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo))payload._replyto=replyTo;
    if(button)button.disabled=true;
    if(buttonLabel)buttonLabel.textContent='送信中';
    setStatus('送信しています…','sending');
    try{
      const res=await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(mail)}`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload)
      });
      let data={};
      try{data=await res.json()}catch(_){ }
      if(!res.ok||data.success===false)throw new Error(data.message||`HTTP ${res.status}`);
      f.reset();
      setStatus('送信しました。内容を確認のうえご連絡します。','success');
      if(buttonLabel)buttonLabel.textContent='送信済み';
      setTimeout(()=>{if(buttonLabel)buttonLabel.textContent='送信する'},2400);
    }catch(err){
      console.error('contact submit failed',err);
      setStatus('送信に失敗しました。時間を置いて再度お試しいただくか、X DMからご連絡ください。','error');
      if(buttonLabel)buttonLabel.textContent='再送する';
    }finally{
      if(button)button.disabled=false;
    }
  });
}
function ui(){
  // Casual image protection: prevents direct drag/save and image context menus.
  // This cannot make web-delivered images technically impossible to retrieve.
  document.addEventListener('dragstart',e=>{
    if(e.target instanceof HTMLImageElement || e.target.closest?.('.work-image,.portrait,.brand,.service-media,.detail-media'))e.preventDefault();
  });
  document.addEventListener('contextmenu',e=>{
    if(e.target instanceof HTMLImageElement || e.target.closest?.('.work-image,.portrait,.brand,.service-media,.detail-media'))e.preventDefault();
  });
  $$('img').forEach(img=>{img.draggable=false;img.setAttribute('oncontextmenu','return false')});
  const b=$('.menu-button'),n=$('.mobile-nav');if(b&&n)b.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',String(o));n.setAttribute('aria-hidden',String(!o))});
  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase(),navCurrent=current==='work-detail.html'?'work.html':current;
  $$('.main-nav a,.mobile-nav a').forEach(a=>{const href=(a.getAttribute('href')||'').toLowerCase();if(href===navCurrent)a.classList.add('current')});
  const t=$('.to-top');if(t){const up=()=>t.classList.toggle('show',scrollY>500);addEventListener('scroll',up,{passive:true});up();t.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}))}
  const c=$('#copy-template');if(c)c.addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#request-template').innerText);c.classList.add('is-copied');c.setAttribute('aria-label','コピーしました');c.dataset.tooltip='コピーしました';setTimeout(()=>{c.classList.remove('is-copied');c.setAttribute('aria-label','テンプレートをコピー');c.dataset.tooltip='コピー'},1200)}catch(_){c.setAttribute('aria-label','コピーに失敗しました');c.dataset.tooltip='コピー失敗';setTimeout(()=>{c.setAttribute('aria-label','テンプレートをコピー');c.dataset.tooltip='コピー'},1200)}})
}
ui();site();works();detail();services();flow();contact();
})();
