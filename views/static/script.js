function setCookie() {
  var email = document.getElementById("email").value;
  if(!email) {
    return alert("Please, write your email.")
  }
  document.cookie = `user=${email}`
  window.location.href = "/"
}

function delCookie() {
  if(document.cookie) {
    document.cookie = `user` + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    alert("Você se deslogou.");
    return window.location.href = "/";
  }
}