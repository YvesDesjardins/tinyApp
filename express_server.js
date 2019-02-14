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

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  j2ufo2: {
    longURL: "https://www.lighthouselabs.ca",
    userID: "abc123"
  }
};
const usersDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "abc123": {
    id: "abc123",
    email: "test",
    password: "test"
  }
}

// ******************************************************************
// app responses to client requests
app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUserID(req.cookies["userID"]),
    users: usersDatabase,
    userID: req.cookies["userID"]
  };
  res.render("urls_index", templateVars);
});
app.post("/urls", (req, res) => {
  let tempID = generateRandomString();

  urlDatabase[tempID] = {
    longURL: checkURL(req.body.longURL),
    userID: req.cookies["userID"]
  };
  res.redirect(`/urls/${tempID}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    users: usersDatabase,
    userID: req.cookies["userID"]
  }
  res.render("urls_new", templateVars);
});
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});


app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.cookies["userID"]) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase,
      users: usersDatabase,
      userID: req.cookies["userID"]
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(401).send("Unauthorized Access");
  }
});
app.post("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.cookies["userID"]) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL],
      users: usersDatabase,
      userID: req.cookies["userID"]
    };
    res.render("urls_edit", templateVars);
  } else {
    res.status(401).send("Unauthorized Access");
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.cookies["userID"]) {
    urlDatabase[req.params.shortURL] = checkURL(req.body.longURL);
    res.redirect('/urls');
  } else {
    res.status(401).send("Unauthorized Access");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    users: usersDatabase,
    userID: req.cookies["userID"]
  };
  res.render('login', templateVars);
});
app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userID = emailToID(userEmail);

  if (!isEmailFree(userEmail) && passwordVerify(userID, req.body.password)) {
    res.cookie("userID", userID);
    res.redirect('/urls');
  } else {
    res.status(403).send("Error, invalid email / password");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  let templateVars = {
    users: usersDatabase,
    userID: req.cookies["userID"]
  };
  res.render("register", templateVars);
});
app.post("/register", (req, res) => {
  // tempory id solution
  let user = generateRandomString();

  if (isEmailFree(req.body.email) && req.body.email !== "" &&
    req.body.password !== "") {
    usersDatabase[user] = {
      id: user,
      email: req.body.email,
      password: req.body.password
    };

    res.cookie("userID", user);
    res.redirect("/urls");
  } else {
    res.status(400).send("Error, invalid email / password");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// end responses to client requests
// ******************************************************************

app.listen(PORT);

function generateRandomString() {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += generateRandomNumber(16).toString(16);
  }

  return urlDatabase[out] ? generateRandomString() : out;
}

function generateRandomNumber(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function checkURL(url) {
  return url.startsWith('http://') ? url : `http://${url}`;
}

function isEmailFree(email) {
  for (const key in usersDatabase) {
    if (usersDatabase[key].email === email) {
      return false;
    }
  }

  return true;
}

function passwordVerify(id, pass) {
  return usersDatabase[id].password.toString() === pass.toString();
}

function emailToID(email) {
  for (const key in usersDatabase) {
    if (usersDatabase[key].email === email) {
      return usersDatabase[key].id;
    }
  }

  return false;
}

function urlsForUserID(id) {
  let temp = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      temp[key] = urlDatabase[key];
    }
  }

  console.log(temp);
  return temp;
}