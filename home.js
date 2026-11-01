(async()=>{
  const session=getSession();
  if(!session || session.user.role!=="artist"){location.replace("index.html");return;}
  document.getElementById("logoutBtn").onclick=()=>{clearSession();location.replace("index.html");};
  try{
    const data=await callApi("myProfile",{},session.token);
    const u=data.user;
    document.getElementById("artistName").textContent=u.artistName;
    document.getElementById("uuid").textContent=u.uuid;
    document.getElementById("email").textContent=u.email;
    document.getElementById("coin").textContent=u.coin;
    const fb=document.getElementById("facebook");if(u.facebook){fb.href=u.facebook;fb.textContent="Mở Facebook";}else fb.textContent="Chưa có";
    const card=document.getElementById("statusCard");
    const label={PENDING:"Chưa phê duyệt",APPROVED:"Đã duyệt",BANNED:"Đã khóa"}[u.status]||u.status;
    document.getElementById("statusText").textContent=label;
    card.classList.toggle("gold",u.status==="APPROVED");card.classList.toggle("silver",u.status!=="APPROVED");
    const list=await callApi("listApproved",{},session.token);
    const host=document.getElementById("approvedArtists");host.textContent="";
    if(!list.users.length){host.textContent="Chưa có Artist được duyệt.";}
    list.users.forEach(a=>{const span=document.createElement("span");span.className="artist-pill";span.textContent=a.artistName;host.appendChild(span);});
  }catch(err){document.getElementById("statusText").textContent=err.message;if(/hết hạn|đăng nhập/i.test(err.message)){clearSession();}}
})();
