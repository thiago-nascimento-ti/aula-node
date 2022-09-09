const jetpack = require("fs-jetpack");
const express = require("express");
const Eta = require('eta');

var cookieParser = require('cookie-parser')
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
    new Date(artigo.date).toLocaleDateString('pt-BR');
    listagem.push({ ...artigo, slug});
  }

  const formattedHtml = Eta.render(html, listagem, owner)

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
  response.sendFile(__dirname+"/views/login.html");
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
