let express = require("express");
let app = express();
let PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
let cookieParser = require('cookie-parser')
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// ******************************************************************
// app responses to client requests
app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});
app.post("/urls", (req, res) => {
  let tempID = generateRandomString();
  let tempLongURL = checkURL(req.body.longURL);

  urlDatabase[tempID] = tempLongURL;
  res.redirect(`/urls/${tempID}`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {
    username: req.cookies["username"]
  });
});
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});


app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});
app.post("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_edit", templateVars);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL] = checkURL(req.body.longURL);
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect('/urls');
});
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// end responses to client requests
// ******************************************************************

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += generateRandomNumber(16).toString(16);
  }

  if (urlDatabase[out]) {
    return generateRandomString();
  }
  return out;
}

function generateRandomNumber(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function checkURL(url) {
  // if client didn't start url with http:// add it for them
  if (!url.startsWith('http://')) {
    return `http://${url}`;
  }

  return url;
}