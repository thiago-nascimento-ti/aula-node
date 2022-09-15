const jetpack = require("fs-jetpack");
const express = require("express");
const Eta = require('eta');
const jwt = require('jsonwebtoken');

var cookieParser = require('cookie-parser')
const server = express();

// server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cookieParser())

server.get("/", (request, response) => {
  const database = JSON.parse(jetpack.read('./database.json'));
  const artigos = database.article;

  const html = jetpack.read(__dirname+"/views/index.html");

  const listagem = []
  for (slug in artigos) {
    const artigo = artigos[slug];
    listagem.push({ ...artigo, slug });
  }

  const formattedHtml = Eta.render(html, listagem)
  
  response.send(formattedHtml);
});

server.get("/artigo/apagar/:slug", (request, response) => {
  const slug = request.params.slug

  const database = JSON.parse(jetpack.read('./database.json'));
  delete database.article[slug];
  jetpack.write('./database.json', database);

  response.redirect("/");
});

server.get("/artigo/:slug", (request, response) => {
  const slug = request.params.slug;

  const database = JSON.parse(jetpack.read('./database.json'));
  const artigo = database.article[slug];

  if (request.headers.accept === "application/json") {
    response.json({ ...artigo, slug });
  } else {
    const html = jetpack.read(__dirname+"/views/artigo.html");
    const formattedHtml = Eta.render(html, { ...artigo, slug })
    response.send(formattedHtml);
  }
});

server.get("/login", (request, response) => {
  const html = jetpack.read(__dirname+"/views/login.html");
  const feedback = "";
  const formattedHtml = Eta.render( html, feedback );
  response.send(formattedHtml);
});

server.post("/login", (request, response) => {
  const html = jetpack.read(__dirname+"/views/login.html");
  const database = JSON.parse(jetpack.read('./database.json'));
  const dataReq = request.body;
  const comparative = database.users[dataReq.email];

  if(comparative) {
    if(dataReq.password === comparative.password) {
      if(!request.cookies.user){
        const token = jwt.sign({ user: dataReq.email}, '1234');
        response.cookie('user', token).redirect("/");
      } else {
        var userTokenLog = false;
        jwt.verify(request.cookies.user, '1234', function(err, decoded) {
          userTokenLog = decoded.user;
        });
        if(dataReq.email === userTokenLog) {
          const feedback = "Você ja esta logado.";
          const formattedHtml = Eta.render(html, feedback)
          response.send(formattedHtml);
        } else {
          const token = jwt.sign({ user: dataReq.email}, '1234');
          response.cookie('user', token).redirect("/");
        }
      }
    } else {
      const feedback = "A senha esta errada.";
      const formattedHtml = Eta.render(html, feedback)
      response.send(formattedHtml);
    }
  } else {
    const feedback = "O email não existe.";
    const formattedHtml = Eta.render(html, feedback)
    response.send(formattedHtml);
  }
});

server.get("/cadastroUser", (request, response) => {
  var emailMsn = "Insira um email:";
  var password1Msn = "Insira sua senha:";
  var password2Msn = "Confirme a senha:";

  const html = jetpack.read(__dirname+"/views/cadastroUser.html");
  const formattedHtml = Eta.render(html, { emailMsn, password1Msn, password2Msn });
  response.send(formattedHtml);
});

server.post("/cadastroUser", (request, response) => {
  const html = jetpack.read(__dirname+"/views/cadastroUser.html");
  const database = JSON.parse(jetpack.read('./database.json'));
  const user = request.body;

  var emailMsn = "Insira um email:";
  var password1Msn = "Insira sua senha:";
  var password2Msn = "Confirme a senha:";

  if(database.users[user.email]) {
    user.email = undefined;
    emailMsn = "email já cadastrado!";
    const formattedHtml = Eta.render(html, { emailMsn, password1Msn, password2Msn });
    return response.send(formattedHtml);
  } else {
      if(user.password1){
        if(user.password1 === user.password2){
          database.users[user.email] = {
            email: user.email,
            password: user.password2,
          };
          jetpack.write('./database.json', database);
          const token = jwt.sign({ user: user.email}, '1234');
          response.cookie('user', token).redirect("/");
        } else if (!user.password2){
          password2Msn = "Você precisa confirmar sua senha.";
          const formattedHtml = Eta.render(html, { emailMsn, password1Msn, password2Msn });
          return response.send(formattedHtml);
        } else if (user.password1 !== user.password2) {
          password2Msn = "As senhas não coincidem.";
          const formattedHtml = Eta.render(html, { emailMsn, password1Msn, password2Msn });
          return response.send(formattedHtml);
        }
      } else {
        password1Msn = "Você deve inserir uma senha.";
        const formattedHtml = Eta.render(html, { emailMsn, password1Msn, password2Msn });
        return response.send(formattedHtml);
      }
  }
});

server.get("/cadastro", (request, response) => {
  response.sendFile(__dirname+"/views/cadastro.html");
});

server.get("/cadastro/:slug", (request, response) => {
  const slug = request.params.slug;

  const database = JSON.parse(jetpack.read('./database.json'));
  const artigo = database.article[slug];

  const html = jetpack.read(__dirname+"/views/editar.html");

  const formattedHtml = Eta.render(html, { ...artigo, slug })

  response.send(formattedHtml);
});

server.post("/cadastro", (request, response) => {
  const artigo = request.body;
  if(!request.cookies.user) {
    return response.redirect('/login');
  }
  const owner = request.cookies.user;
  const database = JSON.parse(jetpack.read('./database.json'));
  database.article[artigo.url] = {
    owner,
    title: artigo.titulo,
    content: artigo.conteudo,
  };
  jetpack.write('./database.json', database);

  response.redirect('/');
});

server.get("/:name", (request, response) => {
  const name = request.params.name
  response.sendFile(__dirname+"/views/static/"+name);
});

server.listen(3000, () => {
  console.log("Example app listening on port 3000!")
});
