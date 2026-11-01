/**
 * ANILANDS API — GitHub Pages frontend + Google Sheets backend
 * Giữ nguyên A:I:
 * A id | B username | C email | D password | E coin
 * F role | G created_at | H status | I facebook
 *
 * Script Properties bắt buộc:
 * ANILANDS_SPREADSHEET_ID
 * ANILANDS_SHARED_SECRET (dùng để ký token, không đưa lên GitHub)
 * ANILANDS_ADMIN_USERNAME
 * ANILANDS_ADMIN_PASSWORD_HASH (được tạo bằng initializeAdmin)
 */

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = String(body.action || "");
    const p = body.payload || {};
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty("ANILANDS_SHARED_SECRET");
    const spreadsheetId = props.getProperty("ANILANDS_SPREADSHEET_ID");
    if (!secret || !spreadsheetId) return json({ok:false,message:"API chưa được cấu hình."});

    // Tự khởi tạo admin lần đầu, không cần chạy hàm thủ công.
    ensureAdminInitialized(props);

    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheets()[0];
    if (!sheet) return json({ok:false,message:"Không tìm thấy trang tính."});

    let result;
    if (action === "register") result = registerUser(sheet,p);
    else if (action === "login") result = loginUser(sheet,p,props,secret);
    else {
      const auth = verifyToken(String(body.token || ""),secret);
      if (!auth) return json({ok:false,message:"Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."});
      if (action === "myProfile") result = myProfile(sheet,auth);
      else if (action === "listApproved") result = listApproved(sheet,auth);
      else if (action === "listAll") result = listAll(sheet,auth);
      else if (action === "setStatus") result = setStatus(sheet,p,auth);
      else result = {ok:false,message:"Action không hợp lệ."};
    }
    return json(result);
  } catch(err) {
    return json({ok:false,message:String(err && err.message || err)});
  }
}

function doGet() {
  return ContentService.createTextOutput("ANILANDS API is running.").setMimeType(ContentService.MimeType.TEXT);
}
function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function readUsers(sheet) {
  const n=sheet.getLastRow(); if(n<2)return [];
  return sheet.getRange(2,1,n-1,9).getValues().filter(r=>r[0] !== "").map(r=>({
    uuid:String(r[0]),artistName:String(r[1]),email:String(r[2]).toLowerCase(),
    passwordHash:String(r[3]||""),coin:Number(r[4]||0),role:String(r[5]||"artist"),
    createdAt:String(r[6]),status:String(r[7]||"PENDING"),facebook:String(r[8]||"")
  }));
}
function publicUser(u) {
  return {uuid:u.uuid,artistName:u.artistName,email:u.email,coin:u.coin,role:u.role,status:u.status,createdAt:u.createdAt,facebook:u.facebook};
}
function registerUser(sheet,p) {
  const name=String(p.artistName||"").trim(),email=String(p.email||"").trim().toLowerCase();
  const password=String(p.password||""),facebook=String(p.facebook||"").trim();
  if(!name||!email||!password||!facebook)return {ok:false,message:"Vui lòng điền đầy đủ thông tin."};
  if(password.length<8)return {ok:false,message:"Mật khẩu cần tối thiểu 8 ký tự."};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {ok:false,message:"Gmail không hợp lệ."};
  if(facebook && !/^https:\/\/(www\.)?(facebook\.com|fb\.com)\//i.test(facebook))return {ok:false,message:"Link Facebook không hợp lệ."};
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try {
    const users=readUsers(sheet);
    if(users.some(u=>u.artistName.toLowerCase()===name.toLowerCase()))return {ok:false,message:"Tên Artist đã được sử dụng."};
    if(users.some(u=>u.email===email))return {ok:false,message:"Gmail đã được sử dụng."};
    let max=1000000;users.forEach(u=>{const id=Number(u.uuid);if(Number.isFinite(id)&&id>max)max=id;});
    const uuid=String(max+1),hash=hashPassword(password);
    sheet.appendRow([uuid,name,email,hash,0,"artist",new Date(),"PENDING",facebook]);
    return {ok:true,uuid};
  } finally {lock.releaseLock();}
}
function loginUser(sheet,p,props,secret) {
  const identity=String(p.identity||"").trim().toLowerCase(),password=String(p.password||"");
  if(!identity||!password)return {ok:false,message:"Nhập tài khoản và mật khẩu."};
  const adminName=props.getProperty("ANILANDS_ADMIN_USERNAME")||"admin";
  const adminHash=props.getProperty("ANILANDS_ADMIN_PASSWORD_HASH")||"";
  if(identity===adminName.toLowerCase() && adminHash && verifyPassword(password,adminHash)) {
    const user={role:"admin",artistName:"Administrator"};
    return {ok:true,token:createToken(user,secret),user};
  }
  const user=readUsers(sheet).find(u=>u.artistName.toLowerCase()===identity||u.email===identity);
  if(!user||!verifyPassword(password,user.passwordHash))return {ok:false,message:"Tên Artist/Gmail hoặc mật khẩu không đúng."};
  if(user.status==="BANNED")return {ok:false,message:"Tài khoản đã bị khóa. Vui lòng liên hệ admin."};
  return {ok:true,token:createToken({role:"artist",uuid:user.uuid},secret),user:publicUser(user)};
}
function myProfile(sheet,auth) {
  if(auth.role!=="artist")return {ok:false,message:"Không có quyền truy cập."};
  const u=readUsers(sheet).find(x=>x.uuid===auth.uuid);
  if(!u||u.status==="BANNED")return {ok:false,message:"Tài khoản không còn khả dụng."};
  return {ok:true,user:publicUser(u)};
}
function listApproved(sheet,auth) {
  if(auth.role!=="artist"&&auth.role!=="admin")return {ok:false,message:"Không có quyền truy cập."};
  return {ok:true,users:readUsers(sheet).filter(u=>u.status==="APPROVED").map(u=>({uuid:u.uuid,artistName:u.artistName}))};
}
function listAll(sheet,auth) {
  if(auth.role!=="admin")return {ok:false,message:"Bạn không có quyền quản trị."};
  return {ok:true,users:readUsers(sheet).map(publicUser)};
}
function setStatus(sheet,p,auth) {
  if(auth.role!=="admin")return {ok:false,message:"Bạn không có quyền quản trị."};
  const uuid=String(p.uuid||""),status=String(p.status||"");
  if(!["PENDING","APPROVED","BANNED"].includes(status))return {ok:false,message:"Trạng thái không hợp lệ."};
  const n=sheet.getLastRow();if(n<2)return {ok:false,message:"Chưa có Artist."};
  const ids=sheet.getRange(2,1,n-1,1).getValues();
  for(let i=0;i<ids.length;i++)if(String(ids[i][0])===uuid){sheet.getRange(i+2,8).setValue(status);return {ok:true};}
  return {ok:false,message:"Không tìm thấy Artist."};
}
function createToken(user,secret) {
  const payload={role:user.role,uuid:user.uuid||"",exp:Date.now()+8*60*60*1000,nonce:Utilities.getUuid()};
  const encoded=Utilities.base64EncodeWebSafe(JSON.stringify(payload)).replace(/=+$/,"");
  const sig=Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(encoded,secret)).replace(/=+$/,"");
  return encoded+"."+sig;
}
function verifyToken(token,secret) {
  try {
    const parts=token.split(".");if(parts.length!==2)return null;
    const expected=Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0],secret)).replace(/=+$/,"");
    if(!constantTimeEqual(parts[1],expected))return null;
    const payload=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    if(!payload.exp||Date.now()>payload.exp)return null;
    if(!["admin","artist"].includes(payload.role))return null;
    return payload;
  } catch(e){return null;}
}
function constantTimeEqual(a,b) {
  if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}
// PBKDF2-HMAC-SHA256, 10,000 vòng; chuỗi lưu trong cột D dạng v1$salt$hash.
function hashPassword(password) {
  const salt=Utilities.getUuid().replace(/-/g,"");
  const key=pbkdf2(String(password),salt,10000);
  return "v1$"+salt+"$"+Utilities.base64EncodeWebSafe(key).replace(/=+$/,"");
}
function verifyPassword(password,stored) {
  stored=String(stored||"");
  // Hỗ trợ hash PHP bcrypt cũ nếu có hàm tương thích ở backend riêng; hash mới dùng v1.
  const parts=stored.split("$");
  if(parts.length!==3||parts[0]!=="v1")return false;
  const candidate=Utilities.base64EncodeWebSafe(pbkdf2(String(password),parts[1],10000)).replace(/=+$/,"");
  return constantTimeEqual(candidate,parts[2]);
}
function pbkdf2(password,salt,iterations) {
  const key=Utilities.newBlob(password).getBytes();
  const saltBytes=Utilities.newBlob(salt).getBytes().concat([0,0,0,1]);
  let u=Utilities.computeHmacSha256Signature(saltBytes,key),t=u.slice();
  for(let i=1;i<iterations;i++){u=Utilities.computeHmacSha256Signature(u,key);for(let j=0;j<t.length;j++)t[j]=(t[j]^u[j]);}
  return t;
}
// Tự chạy ở lần gọi API đầu tiên nếu chưa có thông tin admin.
function ensureAdminInitialized(props) {
  if (!props.getProperty("ANILANDS_ADMIN_PASSWORD_HASH")) {
    props.setProperty("ANILANDS_ADMIN_USERNAME", "admin");
    props.setProperty("ANILANDS_ADMIN_PASSWORD_HASH", hashPassword("tri12345"));
  }
}
