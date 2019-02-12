let express = require("express");
let app = express();
let PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let tempID = generateRandomString();
  urlDatabase[tempID] = req.body.longURL;
  res.redirect(`/urls/${tempID}`);
});
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase
  };
  res.render("urls_show", templateVars);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += generateRandomNumber(16).toString(16);
  }

  return out;
}

function generateRandomNumber(max) {
  return Math.floor(Math.random() * Math.floor(max));
}