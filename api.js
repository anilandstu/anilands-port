// URL Apps Script Web App được cấu hình trong js/config.js
async function callApi(action, payload = {}, token = "") {
  const url = window.ANILANDS_API_URL;
  if (!url || url.includes("DAN_URL")) throw new Error("Chưa cấu hình URL Google Apps Script.");
  const response = await fetch(url, {
    method: "POST",
    // text/plain tránh preflight OPTIONS từ GitHub Pages.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload, token })
  });
  if (!response.ok) throw new Error("Không kết nối được API (" + response.status + ").");
  const data = await response.json();
  if (!data.ok) throw new Error(data.message || "Có lỗi xảy ra.");
  return data;
}
function saveSession(data) {
  sessionStorage.setItem("anilands_token", data.token);
  sessionStorage.setItem("anilands_user", JSON.stringify(data.user));
}
function getSession() {
  const token = sessionStorage.getItem("anilands_token");
  const user = sessionStorage.getItem("anilands_user");
  return token && user ? { token, user: JSON.parse(user) } : null;
}
function clearSession() {
  sessionStorage.removeItem("anilands_token");
  sessionStorage.removeItem("anilands_user");
}
