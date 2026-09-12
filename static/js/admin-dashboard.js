const SUPABASE_URL="https://julhswsijtcoyjrjrobk.supabase.co";
const SUPABASE_KEY="sb_publishable_a0qKsqBB0hR9BOWpP3dkwg_7nUOmXYC";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
let currentAdmin=null,editingUpdate=null,currentImagePath=null;

async function verifyAdmin(){
 try{
  const{data,error}=await supabaseClient.auth.getSession();
  if(error)throw error;
  if(!data.session){location.replace("admin-login.html");return false}
  currentAdmin=data.session.user;
  const{data:isAdmin,error:e}=await supabaseClient.rpc("is_admin");
  if(e)throw e;
  if(!isAdmin){
   await supabaseClient.auth.signOut();
   alert("Administrator access required.");
   location.replace("admin-login.html");
   return false
  }
  $("adminEmail").textContent=currentAdmin.email||"Administrator";
  return true
 }catch(e){
  console.error(e);
  location.replace("admin-login.html");
  return false
 }
}

function activateSection(name){
 document.querySelectorAll(".panel-section").forEach(x=>x.classList.remove("active"));
 document.querySelectorAll("[data-section]").forEach(x=>x.classList.toggle("active",x.dataset.section===name));
 const s=$("section-"+name);
 if(s)s.classList.add("active");
 const titles={overview:"Overview",updates:"Website Updates",communications:"Communication",support:"Support Centre",users:"User Management"};
 $("headerTitle").textContent=titles[name]||"Admin Control Center";
 $("adminSidebar").classList.remove("open");
 if(name==="updates")loadUpdates();
 if(name==="users")loadUsers();
}

document.querySelectorAll("[data-section]").forEach(x=>x.addEventListener("click",()=>activateSection(x.dataset.section)));
document.querySelectorAll("[data-open]").forEach(x=>x.addEventListener("click",e=>{
 e.preventDefault();activateSection(x.dataset.open)
}));
$("mobileMenu").onclick=()=>$("adminSidebar").classList.toggle("open");

async function loadStats(){
 try{
  const[r1,r2,r3,r4]=await Promise.all([
   supabaseClient.from("updates").select("id,is_published"),
   supabaseClient.from("profiles").select("id",{count:"exact",head:true}),
   supabaseClient.from("communities").select("id",{count:"exact",head:true}),
   supabaseClient.from("announcements").select("id",{count:"exact",head:true}).eq("is_published",true)
  ]);
  if(!r1.error){
   const total=r1.data?.length||0,pub=r1.data?.filter(x=>x.is_published).length||0;
   $("statUpdates").textContent=total+" / "+pub;
  }
  $("statUsers").textContent=r2.error?"—":r2.count??0;
  $("statCommunities").textContent=r3.error?"—":r3.count??0;
  $("statAnnouncements").textContent=r4.error?"—":r4.count??0;
 }catch(e){console.error("Stats:",e)}
}

function showStatus(msg,type="success"){
 const x=$("updateStatus");
 x.textContent=msg;
 x.className="form-status show "+type;
}

$("updateImage").onchange=function(){
 const f=this.files[0];
 if(!f){$("imagePreview").style.display="none";return}
 if(!f.type.startsWith("image/")||f.size>8*1024*1024){
  showStatus(f.type.startsWith("image/")?"Image must be below 8MB.":"Select a valid image.","error");
  this.value="";return
 }
 const r=new FileReader();
 r.onload=e=>{$("previewImage").src=e.target.result;$("imagePreview").style.display="block"};
 r.readAsDataURL(f);
};

function storagePath(url){
 if(!url)return null;
 try{
  const m="/storage/v1/object/public/updates/";
  const i=url.indexOf(m);
  return i<0?null:decodeURIComponent(url.substring(i+m.length))
 }catch{return null}
}

async function uploadImage(file){
 const ext=file.name.split(".").pop().toLowerCase();
 const path=currentAdmin.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,9)+"."+ext;
 const{error}=await supabaseClient.storage.from("updates").upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
 if(error)throw error;
 const{data}=supabaseClient.storage.from("updates").getPublicUrl(path);
 return{url:data.publicUrl,path}
}

async function removeImage(path){
 if(!path)return;
 const{error}=await supabaseClient.storage.from("updates").remove([path]);
 if(error)console.warn("Storage:",error);
}

async function loadUpdates(){
 const list=$("updateList");
 list.innerHTML='<div class="loading-list">Loading updates...</div>';
 try{
  const{data,error}=await supabaseClient.from("updates").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:false});
  if(error)throw error;
  if(!data?.length){
   list.innerHTML='<div class="empty">No website updates have been created yet.</div>';
   return
  }
  list.innerHTML=data.map(u=>{
   const image=u.image_url
    ?`<div class="update-thumb"><img src="${escapeHtml(u.image_url)}" alt="" loading="lazy"></div>`
    :`<div class="update-thumb" style="display:grid;place-items:center;color:#496174">◈</div>`;
   return `<article class="update-item">${image}<div class="update-info">
   <h3>${escapeHtml(u.title||"Untitled update")}</h3>
   <p>${escapeHtml(u.description||"No description provided.").substring(0,180)}</p>
   <div class="update-meta"><span class="tag">${escapeHtml(u.category||"General")}</span>${u.is_published?'<span class="tag live">PUBLISHED</span>':'<span class="tag draft">DRAFT</span>'}<span class="tag">${u.created_at?new Date(u.created_at).toLocaleDateString():""}</span></div>
   </div><div class="update-actions">
   <button class="small-btn" data-edit="${u.id}">Edit</button>
   <button class="small-btn" data-toggle="${u.id}" data-published="${u.is_published}">${u.is_published?"Unpublish":"Publish"}</button>
   <button class="small-btn delete" data-delete="${u.id}">Delete</button>
   </div></article>`
  }).join("");
  bindUpdateActions();
 }catch(e){
  console.error(e);
  list.innerHTML='<div class="empty">Unable to load website updates.</div>'
 }
}

function bindUpdateActions(){
 document.querySelectorAll("[data-edit]").forEach(x=>x.onclick=()=>editUpdate(x.dataset.edit));
 document.querySelectorAll("[data-toggle]").forEach(x=>x.onclick=()=>togglePublished(x.dataset.toggle,x.dataset.published!=="true"));
 document.querySelectorAll("[data-delete]").forEach(x=>x.onclick=()=>deleteUpdate(x.dataset.delete));
}

async function editUpdate(id){
 try{
  const{data,error}=await supabaseClient.from("updates").select("*").eq("id",id).single();
  if(error)throw error;
  editingUpdate=data;
  $("updateId").value=data.id;
  $("updateTitle").value=data.title||"";
  $("updateCategory").value=data.category||"";
  $("updateDescription").value=data.description||"";
  $("updateButtonText").value=data.button_text||"";
  $("updateButtonUrl").value=data.button_url||"";
  $("updateSortOrder").value=data.sort_order??0;
  $("updatePublished").checked=!!data.is_published;
  $("updateExpires").value=data.expires_at?new Date(new Date(data.expires_at).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):"";
  currentImagePath=storagePath(data.image_url);
  if(data.image_url){
   $("previewImage").src=data.image_url;
   $("imagePreview").style.display="block"
  }else $("imagePreview").style.display="none";
  $("updateFormTitle").textContent="Edit Update";
  $("saveUpdate").textContent="Save Changes";
  $("cancelEdit").hidden=false;
  showStatus("Editing selected update.");
  scrollTo({top:0,behavior:"smooth"});
 }catch(e){console.error(e);showStatus("Unable to load this update.","error")}
}

$("updateForm").onsubmit=async e=>{
 e.preventDefault();
 const b=$("saveUpdate");
 if(b.disabled)return;
 b.disabled=true;
 b.textContent=editingUpdate?"Saving...":"Creating...";
 let newPath=null;
 try{
  const title=$("updateTitle").value.trim();
  if(!title)throw Error("Update title is required.");
  const f=$("updateImage").files[0];
  let imageUrl=editingUpdate?.image_url||null;
  if(f){
   showStatus("Uploading image to Supabase Storage...");
   const up=await uploadImage(f);
   imageUrl=up.url;
   newPath=up.path;
  }
  const published=$("updatePublished").checked;
  const payload={
   title,
   category:$("updateCategory").value.trim()||null,
   description:$("updateDescription").value.trim()||null,
   image_url:imageUrl,
   button_text:$("updateButtonText").value.trim()||null,
   button_url:$("updateButtonUrl").value.trim()||null,
   is_published:published,
   published_at:published?(editingUpdate?.published_at||new Date().toISOString()):null,
   expires_at:$("updateExpires").value?new Date($("updateExpires").value).toISOString():null,
   sort_order:Number($("updateSortOrder").value)||0,
   updated_at:new Date().toISOString()
  };
  if(editingUpdate){
   const{error}=await supabaseClient.from("updates").update(payload).eq("id",editingUpdate.id);
   if(error)throw error;
   if(newPath&&currentImagePath&&newPath!==currentImagePath)await removeImage(currentImagePath);
   showStatus("Update successfully saved.")
  }else{
   const{error}=await supabaseClient.from("updates").insert(payload);
   if(error){if(newPath)await removeImage(newPath);throw error}
   showStatus("Update successfully created.")
  }
  resetForm();
  await loadUpdates();
  await loadStats();
 }catch(e){
  console.error(e);
  showStatus(friendlyError(e),"error");
 }finally{
  b.disabled=false;
  b.textContent=editingUpdate?"Save Changes":"Save Update";
 }
};

async function togglePublished(id,publish){
 try{
  const{error}=await supabaseClient.from("updates").update({
   is_published:publish,
   published_at:publish?new Date().toISOString():null,
   updated_at:new Date().toISOString()
  }).eq("id",id);
  if(error)throw error;
  await loadUpdates();
  await loadStats();
 }catch(e){alert("Unable to change publication status: "+friendlyError(e))}
}

async function deleteUpdate(id){
 if(!confirm("Delete this update permanently?\n\nIts database record and image will be removed."))return;
 try{
  const{data,error}=await supabaseClient.from("updates").select("image_url").eq("id",id).single();
  if(error)throw error;
  const path=storagePath(data?.image_url);
  const{error:e}=await supabaseClient.from("updates").delete().eq("id",id);
  if(e)throw e;
  if(path)await removeImage(path);
  await loadUpdates();
  await loadStats();
 }catch(e){alert("Unable to delete update: "+friendlyError(e))}
}

function resetForm(){
 editingUpdate=null;
 currentImagePath=null;
 $("updateForm").reset();
 $("updateId").value="";
 $("updateSortOrder").value="0";
 $("imagePreview").style.display="none";
 $("previewImage").src="";
 $("updateFormTitle").textContent="Create Update";
 $("saveUpdate").textContent="Save Update";
 $("cancelEdit").hidden=true;
}

$("cancelEdit").onclick=resetForm;

async function loadUsers(){
 const list=$("usersList");
 list.innerHTML='<div class="loading-list">Loading users...</div>';
 try{
  const{data,error}=await supabaseClient.from("profiles").select("id,full_name,email,phone,role,is_active,created_at").order("created_at",{ascending:false});
  if(error)throw error;
  if(!data?.length){list.innerHTML='<div class="empty">No profiles found.</div>';return}
  list.innerHTML=data.map(u=>{
   const initial=(u.full_name||u.email||"U").charAt(0).toUpperCase();
   return `<article class="update-item"><div class="update-thumb" style="display:grid;place-items:center;color:var(--admin-cyan);font-size:20px;font-weight:900">${escapeHtml(initial)}</div><div class="update-info"><h3>${escapeHtml(u.full_name||"Unnamed user")}</h3><p>${escapeHtml(u.email||"No email")}${u.phone?" · "+escapeHtml(u.phone):""}</p><div class="update-meta"><span class="tag">${escapeHtml(u.role||"member")}</span>${u.is_active?'<span class="tag live">ACTIVE</span>':'<span class="tag draft">INACTIVE</span>'}</div></div><div class="update-actions"><span class="tag">PROFILE</span></div></article>`
  }).join("")
 }catch(e){
  console.error(e);
  list.innerHTML='<div class="empty">Unable to load users.</div>'
 }
}

$("refreshUsers").onclick=loadUsers;
$("refreshUpdates").onclick=async()=>{await loadUpdates();await loadStats()};

$("adminLogout").onclick=async function(){
 this.disabled=true;
 this.textContent="Signing out...";
 try{await supabaseClient.auth.signOut()}finally{location.replace("admin-login.html")}
};

function escapeHtml(v){
 return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function friendlyError(e){
 const m=e?.message||"An unexpected error occurred.";
 const x=m.toLowerCase();
 if(x.includes("row-level"))return"Administrator permission was denied by the database.";
 if(x.includes("storage"))return"Storage operation failed. Check the updates bucket and policies.";
 if(x.includes("duplicate"))return"This item already exists.";
 return m;
}

function subscribeRealtime(){
 supabaseClient.channel("admin-updates-control")
 .on("postgres_changes",{event:"*",schema:"public",table:"updates"},()=>{
  loadUpdates();loadStats();
 }).subscribe();
}

(async()=>{
 if(await verifyAdmin()){
  await loadStats();
  await loadUpdates();
  subscribeRealtime();
 }
})();
