const jetpack = require("fs-jetpack");
const express = require("express");
const Eta = require('eta');

var cookieParser = require('cookie-parser');
const { response } = require("express");
const server = express();

// server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cookieParser())

server.get("/", (request, response) => {
  var owner = request.cookies.user;
  if (!owner) {
    owner = "Insira um email.";
  }

  const database = JSON.parse(jetpack.read('./database.json'));
  const artigos = database.article;
  const html = jetpack.read(__dirname+"/views/index.html");

  const listagem = []
  for (slug in artigos) {
    const artigo = artigos[slug];
    const date = new Date(artigo.date).toLocaleDateString('pt-BR')
    listagem.push({ ...artigo, slug, date });
  }

  const formattedHtml = Eta.render(html, { listagem, owner })

  response.send(formattedHtml);
});

server.get("/acesso-negado", (request, response) => {
  response.sendFile(__dirname+"/views/acesso-negado.html");
})

server.get("/artigo/apagar/:slug", (request, response) => {
  const slug = request.params.slug
  const database = JSON.parse(jetpack.read('./database.json'));

  var artigoOwner = database.article[slug].owner;
  var owner = request.cookies.user;

  if(owner != artigoOwner) {
    return response.redirect("/acesso-negado");
  } else {
    delete database.article[slug];
    jetpack.write('./database.json', database);
    response.redirect("/");
  }
});

server.get("/artigo/:slug", (request, response) => {
  const database = JSON.parse(jetpack.read('./database.json'));
  const slug = request.params.slug;
  const artigo = database.article[slug]

  if (!artigo) {
    const htmlNotFound = jetpack.read(__dirname+"/views/artigoNotFound.html");
    const formattedHtml = Eta.render(htmlNotFound, { slug })
    response.status(404).send(formattedHtml);
  } else if (request.headers.accept === "application/json") {
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
  const userLog = request.cookies.user;
  const dataReq = request.body;
  const isEmailExistent = database.users[dataReq.email];

  if(isEmailExistent) {
    if(dataReq.password === comparative.password) {
      if(dataReq.email === userLog) {
        const feedback = "Você ja esta logado.";
        const formattedHtml = Eta.render(html, feedback)
        response.send(formattedHtml);
      } else {
        response.cookie('user', dataReq.email).redirect("/")
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

server.get("/cadastro-user", (request, response) => {
  const emailMsn = "Insira um email:";
  const password1Msn = "Insira sua senha:";
  const password2Msn = "Confirme a senha:";

  const html = jetpack.read(__dirname+"/views/cadastro-user.html");
  const formattedHtml = Eta.render(html, { emailMsn, password1Msn, password2Msn });
  response.send(formattedHtml);
});

server.post("/cadastro-user", (request, response) => {
  const html = jetpack.read(__dirname+"/views/cadastro-user.html");
  const database = JSON.parse(jetpack.read('./database.json'));
  const user = request.body;
  
  let emailMsn = "Insira um email:";
  let password1Msn = "Insira sua senha:";
  let password2Msn = "Confirme a senha:";

  if(user.email !== request.cookies.user){
    if(user.password1){
      if(user.password1 === user.password2){
        database.users[user.email] = {
          email: user.email,
          password: user.password2,
        };
        jetpack.write('./database.json', database);
        response.cookie('user', user.email).redirect("/");
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
  } else {
    user.email = undefined;
    emailMsn = "email já cadastrado!";
    const formattedHtml = Eta.render(html, { emailMsn, password1Msn, password2Msn });
    return response.send(formattedHtml);
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

  const formattedHtml = Eta.render(html, { ...artigo, slug})

  response.send(formattedHtml);
});

server.post("/cadastro", (request, response) => {
  const formArticle = request.body;
  if(!request.cookies.user) {
    return response.redirect('/login');
  }
  const owner = request.cookies.user;

  var options = {     year: 'numeric',
  month: ('long' || 'short' || 'numeric'),
  weekday: ('long' || 'short'),
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',};

  const database = JSON.parse(jetpack.read('./database.json'));
  const databaseArticle = database.article[formArticle.url] || {};

  database.article[formArticle.url] = {
    owner,
    date: new Date().toJSON(),
    ...databaseArticle,
    title: formArticle.titulo,
    content: formArticle.conteudo,
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
