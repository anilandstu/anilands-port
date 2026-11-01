(async()=>{
  const session=getSession();
  if(!session || session.user.role!=="admin"){location.replace("index.html");return;}
  const tbody=document.getElementById("userRows"), notice=document.getElementById("adminNotice");
  const search=document.getElementById("searchInput");
  document.getElementById("adminLogout").onclick=()=>{clearSession();location.replace("index.html");};
  function msg(s,err=false){notice.textContent=s;notice.classList.toggle("error",err);}
  let users=[];
  async function load(){
    try{const data=await callApi("listAll",{},session.token);users=data.users;render();}
    catch(e){msg(e.message,true);}
  }
  function render(){
    const q=search.value.trim().toLowerCase();
    const shown=users.filter(u=>[u.uuid,u.artistName,u.email].some(v=>String(v).toLowerCase().includes(q)));
    tbody.textContent="";
    if(!shown.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=6;td.textContent="Không có Artist phù hợp.";tr.appendChild(td);tbody.appendChild(tr);return;}
    shown.forEach(u=>{
      const tr=document.createElement("tr");
      const values=[u.uuid,u.artistName,u.email];
      values.forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});
      const fbtd=document.createElement("td");if(u.facebook){const a=document.createElement("a");a.href=u.facebook;a.target="_blank";a.rel="noopener";a.textContent="Facebook";fbtd.appendChild(a);}else fbtd.textContent="—";tr.appendChild(fbtd);
      const std=document.createElement("td"),tag=document.createElement("span");tag.className="status-tag "+u.status;tag.textContent=({PENDING:"Chờ duyệt",APPROVED:"Đã duyệt",BANNED:"Đã khóa"})[u.status]||u.status;std.appendChild(tag);tr.appendChild(std);
      const actions=document.createElement("td"),group=document.createElement("div");group.className="action-group";
      [["APPROVED","Duyệt","approve"],["PENDING","Chờ duyệt",""],["BANNED","Khóa","ban"]].forEach(([status,label,cls])=>{
        const b=document.createElement("button");b.className="small-btn "+cls;b.textContent=label;b.onclick=()=>changeStatus(u.uuid,status);group.appendChild(b);
      });
      actions.appendChild(group);tr.appendChild(actions);tbody.appendChild(tr);
    });
  }
  async function changeStatus(uuid,status){
    try{await callApi("setStatus",{uuid,status},session.token);msg("Đã cập nhật trạng thái.");await load();}
    catch(e){msg(e.message,true);}
  }
  search.addEventListener("input",render);
  document.getElementById("refreshBtn").onclick=load;
  await load();
})();
