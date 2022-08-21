const jetpack = require("fs-jetpack");
const express = require("express");
const Eta = require('eta');

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
    listagem.push({ ...artigo, slug});
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

  const database = JSON.parse(jetpack.read('./database.json'));
  const databaseArticle = database.article[formArticle.url];

  let date = "";
  if (databaseArticle?.date === undefined) {
    date = createDate();
  } else {
    date = databaseArticle.date;
  }

  database.article[formArticle.url] = {
    title: formArticle.titulo,
    content: formArticle.conteudo,
    date,
  };
  jetpack.write('./database.json', database);

  response.redirect('/');
});

server.get("/:name", (request, response) => {
  const name = request.params.name
  response.sendFile(__dirname+"/views/static/"+name);
});

function addZero(i) {
  if (i < 10) {i = "0" + i}
  return i;
}

function createDate() {
  var date = "";
  var day = new Date().toJSON().slice(0,10).split('-').reverse().join('/');
  const d = new Date();
  let h = addZero(d.getHours());
  let m = addZero(d.getMinutes());
  let s = addZero(d.getSeconds());
  let time = h + ":" + m + ":" + s;
  date = day + " as " + time;
  return date;
}

server.listen(3000, () => {
  console.log("Example app listening on port 3000!")
});
