const jetpack = require("fs-jetpack");
const express = require("express");
const Eta = require('eta');

var cookieParser = require('cookie-parser')
const server = express();

// server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cookieParser())

//const database = JSON.parse(jetpack.read('./database.json'));
//console.log(typeof(database.article))
server.get("/", (request, response) => {
  const database = JSON.parse(jetpack.read('./database.json'));
  const artigos = database.article;

  const html = jetpack.read(__dirname+"/views/index.html");

  const listagem = []
  for (slug in artigos) {
    const artigo = artigos[slug];
    listagem.push({ ...artigo, slug });
  }

  console.log(listagem)
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

  const formattedHtml = Eta.render(html, { ...artigo, slug })

  response.send(formattedHtml);
});

server.post("/cadastro", (request, response) => {
  const artigo = request.body;

  const database = JSON.parse(jetpack.read('./database.json'));
  database.article[artigo.url] = {
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
