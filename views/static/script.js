function setCookie() {
  var email = document.getElementById("email").value;
  if(email === "") {
    return alert("Please, write your email.")
  }
  document.cookie = `user=${email}`
  window.location.href = "/"
}