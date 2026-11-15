let password='',tours=[];const $=s=>document.querySelector(s);const form=$('#tourForm');function item(tag,text){const e=document.createElement(tag);e.textContent=text;return e}async function api(path,method='GET',body){const r=await fetch(path,{method,headers:{'X-Admin-Password':password,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw Error(data.error||'Erro de conexão');return data}
async function refresh(){tours=await api('/api/tours');const leads=await api('/api/admin/interests');const list=$('#adminTours');list.replaceChildren();for(const t of tours){const box=item('div',`${t.title} · ${t.category} · ${t.price!=null?'R$ '+t.price:'sem preço'} · ${t.verified?'Confirmado':'Exemplo'}`);box.className='admin-item';const edit=item('button','Editar');edit.onclick=()=>{for(const key of ['id','title','category','location','price','description','image_url','image_credit','provider','contact'])form.elements[key].value=t[key]??'';form.elements.verified.checked=!!t.verified;showPreview(t.image_url);$('#formTitle').textContent='Editar passeio';form.scrollIntoView({behavior:'smooth'})};const del=item('button','Excluir');del.className='danger';del.onclick=async()=>{if(!confirm('Excluir este passeio?'))return;try{await api('/api/admin/tours/'+t.id,'DELETE');await refresh()}catch(e){alert(e.message)}};box.append(document.createElement('br'),edit,del);list.append(box)}if(!tours.length)list.append(item('p','Nenhum passeio cadastrado.'));const inbox=$('#adminLeads');inbox.replaceChildren();for(const l of leads){const box=item('div',`${l.name} (${l.profile})`);box.className='admin-item';box.append(item('p',l.email),item('p',l.message||'Sem mensagem'),item('small',l.created_at),document.createElement('br'));const pub=item('button','Publicar como anúncio');pub.onclick=()=>useLead(l);box.append(pub);inbox.append(box)}if(!leads.length)inbox.append(item('p','Nenhuma mensagem recebida.'))}
$('#loginBtn').onclick=async()=>{password=$('#adminPassword').value;try{await api('/api/admin/check');$('#adminContent').hidden=false;$('#loginStatus').textContent='Acesso autorizado.';await refresh()}catch(e){password='';$('#adminContent').hidden=true;$('#loginStatus').textContent=e.message}};$('#logoutBtn').onclick=()=>{password='';$('#adminPassword').value='';$('#adminContent').hidden=true;$('#loginStatus').textContent='Sessão encerrada.'};
function clearForm(){form.reset();form.elements.id.value='';showPreview('');pendingLead=null;$('#formTitle').textContent='Cadastrar passeio'}$('#cancelEdit').onclick=clearForm;
form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));data.verified=form.elements.verified.checked;const id=data.id;delete data.id;try{const lead=pendingLead;await api(id?'/api/admin/tours/'+id:'/api/admin/tours',id?'PUT':'POST',data);if(lead&&!id)await api('/api/admin/interests/'+lead,'DELETE');$('#saveStatus').textContent=lead&&!id?'Passeio publicado e pedido removido da lista.':'Passeio salvo com sucesso.';clearForm();await refresh()}catch(err){$('#saveStatus').textContent=err.message}});
$('#exportBtn').onclick=async()=>{try{const data=await api('/api/admin/export');const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='maceio-nautica-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){alert(e.message)}};
$('#deleteLeadsBtn').onclick=async()=>{if(!confirm('Apagar permanentemente todas as mensagens?'))return;try{await api('/api/admin/interests','DELETE');await refresh()}catch(e){alert(e.message)}};

let pendingLead=null;
const leadCats={'Barco':'barco','Catamarã':'catamara','Mergulho':'mergulho','Jangada':'jangada'};
async function prepImage(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('Use uma imagem JPG, PNG ou WebP.');
  try{const bmp=await createImageBitmap(file),k=Math.min(1,1600/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.85));if(b&&b.size<file.size)return b}catch{}
  if(file.size>4e6)throw Error('A foto é grande demais (máx. 4 MB).');return file;
}
async function uploadImage(file){const b=await prepImage(file);const r=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':b.type||'image/jpeg'},body:b});const d=await r.json();if(!r.ok)throw Error(d.error||'Falha no envio da foto');return d.url}
function showPreview(url){const p=$('#photoPreview');p.hidden=!url;if(url)p.src=url;$('#photoFile').value=''}
$('#photoFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('#saveStatus').textContent='Enviando foto…';try{const url=await uploadImage(f);form.elements.image_url.value=url;if(!form.elements.image_credit.value)form.elements.image_credit.value='Foto enviada pelo anunciante';const p=$('#photoPreview');p.src=url;p.hidden=false;$('#saveStatus').textContent='Foto enviada.'}catch(err){$('#saveStatus').textContent=err.message}};
function useLead(l){
  const msg=l.message||'',g=r=>(msg.match(r)||[])[1]||'';
  const m=msg.match(/Quero anunciar \(([^)]*)\):\s*([\s\S]*)$/),type=m?m[1]:'',text=m?m[2]:msg;
  clearForm();pendingLead=l.id;
  form.elements.provider.value=l.name;
  form.elements.contact.value=g(/WhatsApp:\s*([^|]+?)\s*(?:\||$)/);
  form.elements.price.value=g(/Preço:\s*(\d+)/);
  const foto=g(/Foto:\s*(uploads\/[0-9a-f]{16}\.(?:jpg|png|webp))/);
  if(foto){form.elements.image_url.value=foto;form.elements.image_credit.value='Foto enviada pelo anunciante';showPreview(foto)}
  form.elements.category.value=leadCats[type]||'barco';
  form.elements.title.value=leadCats[type]?`Passeio de ${type.toLowerCase()}`:'';
  form.elements.location.value='Maceió, AL';
  form.elements.description.value=text==='sem detalhes'?'':text;
  $('#formTitle').textContent='Cadastrar passeio (a partir de um pedido)';
  $('#saveStatus').textContent='Dados do pedido carregados. Confira, marque "Confirmado" se já falou com o anunciante e salve: o pedido sai da lista sozinho.';
  form.scrollIntoView({behavior:'smooth'});form.elements.title.focus({preventScroll:true});
}
