const tabs = document.querySelectorAll(".tab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const notice = document.getElementById("notice");
function showNotice(message, error=false){notice.textContent=message;notice.classList.toggle("error",error);}
tabs.forEach(tab=>tab.addEventListener("click",()=>{
  tabs.forEach(t=>t.classList.toggle("active",t===tab));
  loginForm.classList.toggle("hidden",tab.dataset.tab!=="login");
  registerForm.classList.toggle("hidden",tab.dataset.tab!=="register");
  showNotice("");
}));
document.getElementById("forgotBtn").addEventListener("click",()=>{
  alert("Vui lòng liên hệ admin hoặc gửi yêu cầu thay đổi mật khẩu qua gmail: anilandstu.onl@gmail.com");
});
loginForm.addEventListener("submit",async e=>{
  e.preventDefault(); const fd=new FormData(loginForm);
  const identity=fd.get("identity").trim(), password=fd.get("password");
  try{
    showNotice("Đang đăng nhập...");
    const result=await callApi("login",{identity,password});
    saveSession(result);
    location.href=result.user.role==="admin"?"admin.html":"home.html";
  }catch(err){showNotice(err.message,true);}
});
registerForm.addEventListener("submit",async e=>{
  e.preventDefault();const fd=new FormData(registerForm);
  try{
    showNotice("Đang tạo tài khoản...");
    const result=await callApi("register",{
      artistName:fd.get("artistName").trim(),email:fd.get("email").trim(),
      password:fd.get("password"),facebook:fd.get("facebook").trim()
    });
    registerForm.reset();
    showNotice("Đăng ký thành công! UUID của bạn: "+result.uuid+". Tài khoản đang chờ phê duyệt.");
  }catch(err){showNotice(err.message,true);}
});
