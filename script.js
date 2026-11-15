/* Maceió Náutica — vitrine estilo classificados.
   Com `python server.py` os dados vêm do SQLite (/api/tours).
   Sem servidor (ex.: GitHub Pages) usa os anúncios demonstrativos abaixo. */
const $=s=>document.querySelector(s);
const labels={barco:'Barco',catamara:'Catamarã',mergulho:'Mergulho',jangada:'Jangada'};
const state={q:'',cat:'todos',loc:'',min:'',max:'',verified:false,fav:false,sort:'recent'};
let tours=[];

const fallback=[
{id:8,title:'Jangada nas piscinas naturais',provider:'Piscinas & Jangadas',contact:'(82) 90000-0008 (WhatsApp)',category:'jangada',location:'Pajuçara, Maceió',description:'Saída de jangada até as piscinas naturais, com tempo para banho.',image_url:'https://dicasdonordeste.com/wp-content/uploads/2023/05/praia-de-pajucara-maceio.jpg',image_credit:'Dicas do Nordeste / Praia de Pajuçara',price:30,verified:0},
{id:7,title:'Batismo de mergulho',provider:'Mar Fundo Mergulho',contact:'(82) 90000-0007 (WhatsApp)',category:'mergulho',location:'Pontal da Barra, Maceió',description:'Experiência de mergulho para iniciantes, com acompanhamento de instrutor.',image_url:'https://www.divemoregroup.com/Photos/Excursions/4_df9d1_lg.jpg',image_credit:'Dive More Group',price:250,verified:0},
{id:6,title:'Catamarã ao pôr do sol',provider:'Pôr do Sol Cruzeiros',contact:'(82) 90000-0006 (WhatsApp)',category:'catamara',location:'Jaraguá, Maceió',description:'Passeio de fim de tarde de catamarã pela orla.',image_url:'https://4.bp.blogspot.com/--GgSAzKY2Jo/U8K2NPtWSAI/AAAAAAAAAUQ/LiQlcZVKMs8/s1600/SAM_0565.JPG',image_credit:'Blog / catamarã Nove Ilhas, Maceió',price:150,verified:0},
{id:5,title:'Barco até a Praia do Francês',provider:'Francês Barcos',contact:'(82) 90000-0005 (WhatsApp)',category:'barco',location:'Praia do Francês, Marechal Deodoro',description:'Passeio de barco com saída e retorno no mesmo dia. Horários e valores devem ser confirmados com o prestador.',image_url:'https://r2.luckreceptivo.com.br/8230/01JJMKB879X977WKKG103BVCAP.jpg',image_credit:'Luck Receptivo / Praia do Francês',price:60,verified:0},
{id:4,title:'Passeios de jangada',provider:'Jangadeiros da Pajuçara',contact:'(82) 90000-0004 (WhatsApp)',category:'jangada',location:'Pajuçara, Maceió',description:'Conheça as jangadas tradicionais e as experiências ligadas às piscinas naturais da Pajuçara.',image_url:'https://img.7segundos.com.br/0bEZCK6FXqBN1YpD58g5WiQXmII%3D/1200x630/smart/s3.7segundos.com.br/uploads/imagens/117047-passeio_de_jangada_na_praia_da_pajucara_1024x686_jpg.jpeg',image_credit:'7Segundos / passeio de jangada em Pajuçara',price:35,verified:0},
{id:3,title:'Mergulho e contemplação',provider:'Pajuçara Dive',contact:'(82) 90000-0003 (WhatsApp)',category:'mergulho',location:'Piscinas naturais da Pajuçara',description:'Atividades de observação da vida marinha e mergulho, conforme condições do mar e orientação dos profissionais.',image_url:'https://www.amenithotel.com.br/v2/wp-content/uploads/2022/04/02-Piscinas-Naturais-de-Pajucara-Foto-Ciro-Amado-02-1024x683-1.jpg',image_credit:'Foto: Ciro Amado / Amenit Hotel',price:90,verified:0},
{id:2,title:'Experiências de catamarã',provider:'Vela & Mar Catamarãs',contact:'(82) 90000-0002 (WhatsApp)',category:'catamara',location:'Ponta Verde, Maceió',description:'Conheça a modalidade de passeio de catamarã. Os serviços reais dependem de cadastro e confirmação.',image_url:'https://www.amenithotel.com.br/v2/wp-content/uploads/2023/03/IMagem-Catamara-Lopana-Maceio.jpg',image_credit:'Amenit Hotel / catamarã em Maceió',price:180,verified:0},
{id:1,title:'Passeios pelo litoral',provider:'Costa Azul Passeios',contact:'(82) 90000-0001 (WhatsApp)',category:'barco',location:'Maceió, AL',description:'Conheça possibilidades de passeios de barco pelo litoral. Consulte rotas e duração diretamente com os prestadores.',image_url:'https://maceio.al.gov.br/transform/imagens/_1200x630_crop_center-center_82_none/Turismo-Massayo-Verao-2025-Foto-Itawi-Albuquerque.jpeg?mtime=1737397460',image_credit:'Prefeitura de Maceió / Itawi Albuquerque',price:120,verified:0}];

/* ---------- utilitários ---------- */
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
const IMG_UP=/^uploads\/[0-9a-f]{16}\.(jpg|png|webp)$/;
async function prepImage(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('Use uma imagem JPG, PNG ou WebP.');
  try{const bmp=await createImageBitmap(file),k=Math.min(1,1600/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.85));if(b&&b.size<file.size)return b}catch{}
  if(file.size>4e6)throw Error('A foto é grande demais (máx. 4 MB).');return file;
}
async function uploadImage(file){const b=await prepImage(file);const r=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':b.type||'image/jpeg'},body:b});const d=await r.json();if(!r.ok)throw Error(d.error||'Falha no envio da foto');return d.url}
function safeImage(url){if(IMG_UP.test(url))return url;try{const u=new URL(url);return u.protocol==='https:'?u.href:''}catch{return ''}}
function norm(s){return String(s||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
const brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const hasPrice=t=>t.price!==null&&t.price!==undefined&&t.price!=='';
function priceNode(t){
  const p=el('div','price');
  if(hasPrice(t)){p.append(document.createTextNode(brl.format(t.price)+' '),el('small','','por pessoa'))}
  else{p.classList.add('consult');p.textContent='Preço sob consulta'}
  return p;
}
function when(t){
  if(!t.created_at)return 'Recente';
  const d=new Date(t.created_at);if(isNaN(d))return 'Recente';
  const days=Math.floor((new Date().setHours(0,0,0,0)-new Date(d).setHours(0,0,0,0))/864e5);
  const hm=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  if(days<=0)return 'Hoje, '+hm;
  if(days===1)return 'Ontem, '+hm;
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
}
function photo(t,alt){
  const img=el('img');img.src=safeImage(t.image_url)||`assets/${labels[t.category]?t.category:'placeholder'}.svg`;img.alt=alt;img.loading='lazy';img.onload=()=>img.classList.add('ld');
  img.onerror=()=>{img.onerror=null;img.src=`assets/${labels[t.category]?t.category:'placeholder'}.svg`};return img;
}

/* ---------- favoritos (localStorage, opcional) ---------- */
let favs=new Set();
try{favs=new Set(JSON.parse(localStorage.getItem('mn_favs')||'[]'))}catch{}
function saveFavs(){try{localStorage.setItem('mn_favs',JSON.stringify([...favs]))}catch{}$('#favCount').textContent=favs.size}
let justFav=null;
function toggleFav(id){favs.has(id)?favs.delete(id):favs.add(id);justFav=favs.has(id)?id:null;saveFavs();render();justFav=null;const c=$('#favCount');c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump')}

/* ---------- filtro + ordenação ---------- */
function visible(){
  const q=norm(state.q.trim()),min=state.min===''?null:Number(state.min),max=state.max===''?null:Number(state.max);
  let list=tours.filter(t=>{
    if(state.cat!=='todos'&&t.category!==state.cat)return false;
    if(state.loc&&t.location!==state.loc)return false;
    if(state.verified&&!t.verified)return false;
    if(state.fav&&!favs.has(t.id))return false;
    if((min!==null||max!==null)&&!hasPrice(t))return false;
    if(min!==null&&t.price<min)return false;
    if(max!==null&&t.price>max)return false;
    return !q||norm([t.title,t.location,t.description,t.provider,labels[t.category]].join(' ')).includes(q);
  });
  const price=t=>hasPrice(t)?Number(t.price):null;
  if(state.sort==='low')list.sort((a,b)=>(price(a)??1e9)-(price(b)??1e9));
  else if(state.sort==='high')list.sort((a,b)=>(price(b)??-1)-(price(a)??-1));
  else list.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))||b.id-a.id);
  return list;
}

function render(opts={}){
  const list=visible(),box=$('#cards');box.replaceChildren();
  $('#count').textContent=list.length===1?'1 anúncio encontrado':`${list.length} anúncios encontrados`;
  $('#crumbCat').textContent=state.cat==='todos'?'Todas as categorias':labels[state.cat];
  $('#empty').hidden=list.length>0;
  document.querySelectorAll('#cats .chip').forEach(c=>c.classList.toggle('active',c.dataset.cat===state.cat));
  list.forEach((t,idx)=>{
    const card=el('article','tour-card');
    if(opts.enter){card.classList.add('enter');card.style.setProperty('--i',opts.stagger?Math.min(idx,10):0)}
    const ph=el('div','tour-photo');
    const open=el('button','card-open');open.type='button';open.setAttribute('aria-label','Ver detalhes: '+t.title);open.onclick=()=>showDetail(t);
    const heart=el('button','heart'+(favs.has(t.id)?' on':'')+(justFav===t.id?' pop':''),favs.has(t.id)?'♥':'♡');heart.type='button';
    heart.setAttribute('aria-label',favs.has(t.id)?'Remover dos favoritos':'Salvar nos favoritos');heart.setAttribute('aria-pressed',String(favs.has(t.id)));
    heart.onclick=e=>{e.stopPropagation();toggleFav(t.id)};
    ph.append(photo(t,`Imagem ilustrativa de ${t.title}`),heart);if(t.verified)ph.append(el('span','badge ok','CONFIRMADO'));
    const body=el('div','tour-body');
    body.append(priceNode(t),el('h3','',t.title),el('span','tour-cat',labels[t.category]||'Passeio'),
      (()=>{const m=el('div','tour-meta');m.append(el('span','','📍 '+(t.location||'Local a confirmar')),el('span','',when(t)));return m})());
    card.append(ph,body,open);box.append(card);
  });
}

function fillLocations(){
  const sel=$('#fLoc'),cur=state.loc;
  sel.replaceChildren(new Option('Todos os locais',''));
  [...new Set(tours.map(t=>t.location).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(l=>sel.append(new Option(l,l)));
  sel.value=cur;
}

/* ---------- detalhes do anúncio ---------- */
function showDetail(t){
  const c=$('#detailContent');
  const left=el('div','detail-photo');left.append(photo(t,`Imagem ilustrativa de ${t.title}`));
  const info=el('div','detail-info');
  info.append(priceNode(t),el('h2','',t.title),el('span','tour-cat',labels[t.category]||'Passeio'),
    el('p','tour-meta','📍 '+(t.location||'Local a confirmar')+' · '+when(t)),
    el('p','detail-credit',t.image_credit?'Foto: '+t.image_credit:'Imagem ilustrativa'));
  const seller=el('div','seller');
  seller.append(el('strong','',t.provider||'Anunciante ainda não cadastrado'),el('small','',t.verified?'Informações confirmadas pelo administrador':'Anunciante em Maceió'));
  if(t.contact){
    const b=el('button','button primary','Ver contato');b.type='button';
    b.onclick=()=>{b.replaceWith(el('div','contact-reveal',t.contact))};seller.append(b);
  }else{seller.append(el('p','warn','O contato só aparece após a confirmação dos dados com o prestador.'))}
  info.append(seller);
  const share=el('a','button subtle','Compartilhar no WhatsApp');
  share.href='https://wa.me/?text='+encodeURIComponent(`${t.title} — ${hasPrice(t)?brl.format(t.price):'preço sob consulta'} · Maceió Náutica ${location.href.split(/[?#]/)[0]}`);
  share.target='_blank';share.rel='noopener';info.append(share);
  const desc=el('div','detail-desc');
  desc.append(el('h3','','Descrição'),el('p','',t.description),el('p','warn','🛟 Segurança: confirme valores, horários e a regularização da embarcação direto com o prestador. Esta plataforma não processa reservas nem pagamentos.'));
  const others=tours.filter(x=>x.id!==t.id),sim=[...others.filter(x=>x.category===t.category),...others.filter(x=>x.category!==t.category)].slice(0,3);
  if(sim.length){
    const box=el('div','similar'),row=el('div','similar-row');box.append(el('h3','','Anúncios parecidos'),row);
    sim.forEach(x=>{const b=el('button','sim-card');b.type='button';b.append(photo(x,x.title),el('span','sim-price',hasPrice(x)?brl.format(x.price):'Sob consulta'),el('span','sim-title',x.title));b.onclick=()=>showDetail(x);row.append(b)});
    desc.append(box);
  }
  c.replaceChildren(el('div','detail'));c.firstChild.append(left,info,desc);
  const dlg=$('#detailDialog'),was=dlg.open;c.firstChild.classList.toggle('swap',was);if(!was)dlg.showModal();dlg.scrollTop=0;
}
$('#closeDialog').onclick=()=>closeDlg($('#detailDialog'));

/* ---------- anunciar passeio (usa a tabela de interesses) ---------- */
function openPost(){$('#postStatus').textContent='';$('#postDialog').showModal()}
$('#postBtn').onclick=openPost;$('#postBtn2').onclick=openPost;$('#closePost').onclick=()=>closeDlg($('#postDialog'));
$('#postForm [name=whatsapp]').addEventListener('input',e=>{const d=e.target.value.replace(/\D/g,'').slice(0,11),k=d.length>10?7:6;e.target.value=d.length>k?`(${d.slice(0,2)}) ${d.slice(2,k)}-${d.slice(k)}`:d.length>2?`(${d.slice(0,2)}) ${d.slice(2)}`:d});
$('#postForm').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget,msg=$('#postStatus');if(!form.reportValidity())return;
  const f=Object.fromEntries(new FormData(form));
  const digits=f.whatsapp.replace(/\D/g,'');
  if(digits.length<10||digits.length>11){msg.textContent='Informe um WhatsApp válido, com DDD.';return}
  try{
    msg.textContent='Enviando…';
    const file=form.elements.photo.files[0],foto=file?await uploadImage(file):'';
    const data={name:f.name,email:f.email,profile:'Prestador de serviço náutico',message:`WhatsApp: ${f.whatsapp} | Preço: ${Number(f.price)}${foto?' | Foto: '+foto:''} | Quero anunciar (${f.type}): ${f.message||'sem detalhes'}`.slice(0,600)};
    const r=await fetch('/api/interests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const res=await r.json();if(!r.ok)throw Error(res.error||'Falha ao enviar');
    msg.textContent='Pedido registrado no banco local. Obrigado!';form.reset();
  }catch(err){msg.textContent='Não foi possível salvar: '+err.message+'. Inicie o servidor com python server.py.'}
});

/* ---------- eventos dos filtros ---------- */
function setCat(v){state.cat=v;$('#fCat').value=v;render({enter:true})}
document.querySelectorAll('#cats .chip').forEach(c=>c.onclick=()=>setCat(c.dataset.cat));
$('#fCat').onchange=e=>setCat(e.target.value);
$('#fLoc').onchange=e=>{state.loc=e.target.value;render({enter:true})};
$('#fMin').oninput=e=>{state.min=e.target.value;render()};
$('#fMax').oninput=e=>{state.max=e.target.value;render()};
$('#fVerified').onchange=e=>{state.verified=e.target.checked;render()};
$('#fFav').onchange=e=>{state.fav=e.target.checked;render()};
$('#sort').onchange=e=>{state.sort=e.target.value;render({enter:true})};
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();state.q=$('#q').value;render();$('.results').scrollIntoView({behavior:'smooth'})});
$('#q').addEventListener('input',e=>{state.q=e.target.value;render()});
$('#favBtn').onclick=()=>{state.fav=!state.fav;$('#fFav').checked=state.fav;render();$('.results').scrollIntoView({behavior:'smooth'})};
function clearAll(){Object.assign(state,{q:'',cat:'todos',loc:'',min:'',max:'',verified:false,fav:false,sort:'recent'});
  $('#q').value='';$('#fCat').value='todos';$('#fLoc').value='';$('#fMin').value='';$('#fMax').value='';$('#fVerified').checked=false;$('#fFav').checked=false;$('#sort').value='recent';render()}
$('#clearFilters').onclick=clearAll;$('#emptyClear').onclick=clearAll;
$('#toggleFilters').onclick=e=>{const o=$('#side').classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(o))};

/* ---------- carga de dados ---------- */
async function load(){
  try{const r=await fetch('/api/tours');if(!r.ok)throw Error();tours=await r.json();$('#dataStatus').textContent='Dados carregados do banco SQLite.'}
  catch{tours=fallback;$('#dataStatus').textContent='Modo demonstração (versão estática). Para ativar banco e painel, execute python server.py.'}
  fillLocations();saveFavs();
  const params=new URLSearchParams(location.search),c=params.get('cat'),q=params.get('q');
  if(c&&labels[c]){state.cat=c;$('#fCat').value=c}
  if(q){state.q=q.slice(0,80);$('#q').value=state.q}
  render({enter:true,stagger:true});
  if(location.hash==='#anunciar')openPost();
}
load();

const hd=document.querySelector('.header');addEventListener('scroll',()=>hd.classList.toggle('scrolled',scrollY>8),{passive:true});

/* fechar janelas com animação de saída (botão, Esc ou clique no fundo) */
function closeDlg(d){
  if(!d.open||d.classList.contains('closing'))return;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){d.close();return}
  let done=false;const end=()=>{if(done)return;done=true;d.classList.remove('closing');d.close()};
  d.classList.add('closing');d.addEventListener('animationend',e=>{if(e.target===d)end()});setTimeout(end,350);
}
document.querySelectorAll('dialog').forEach(d=>{
  d.addEventListener('cancel',e=>{e.preventDefault();closeDlg(d)});
  d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDlg(d)});
});
