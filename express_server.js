const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieSession({
  name: 'session',
  keys: ['somesecretkeyiguess'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
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
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10) // eslint-disable-line
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10) // eslint-disable-line
  },
  "abc123": {
    id: "abc123",
    email: "test",
    password: bcrypt.hashSync("test", 10) // eslint-disable-line
  }
}

app.get("/", (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUserID(req.session.userID),
    users: usersDatabase,
    userID: req.session.userID
  };
  if (req.session.userID) {
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send("Unauthorized Access, please login first");
  }
});
app.post("/urls", (req, res) => {
  if (!req.session.userID) {
    res.status(401).send("Unauthorized Access, please login first");
  }
  let tempID = generateRandomString();

  urlDatabase[tempID] = {
    longURL: checkURL(req.body.longURL),
    userID: req.session.userID
  };
  res.redirect(`/urls/${tempID}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    users: usersDatabase,
    userID: req.session.userID
  }
  res.render("urls_new", templateVars);
});
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.userID) {
    res.status(401).send("Unauthorized Access, please login first");
  }
  if (urlDatabase[req.params.shortURL].userID === req.session.userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(401).send("Unauthorized Access, user has not given you access to this resource"); // eslint-disable-line
  }
});


app.get("/urls/:shortURL", (req, res) => {
  if (!req.session.userID) {
    res.status(401).send("Unauthorized Access, please login first");
  }
  if (shortExists(req.params.shortURL)) {
    if (urlDatabase[req.params.shortURL].userID === req.session.userID) {
      let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase,
        users: usersDatabase,
        userID: req.session.userID
      };
      res.render("urls_show", templateVars);
    } else {
      res.status(401).send("Unauthorized Access, user has not given you access to this resource"); // eslint-disable-line
    }
  } else {
    res.status(404).send("This page does not exist"); // eslint-disable-line
  }
});
app.post("/urls/:shortURL", (req, res) => {
  if (!req.session.userID) {
    res.status(401).send("Unauthorized Access, please login first");
  }
  if (urlDatabase[req.params.shortURL].userID === req.session.userID) {
    urlDatabase[req.params.shortURL].longURL = checkURL(req.body.longURL);
    res.redirect('/urls');
  } else {
    res.status(401).send("Unauthorized Access, user has not given you access to this resource"); // eslint-disable-line
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    users: usersDatabase,
    userID: req.session.userID
  };
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    res.render('login', templateVars);
  }
});
app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userID = emailToID(userEmail);

  if (!isEmailFree(userEmail) && passwordVerify(userID, req.body.password)) {
    req.session.userID = userID;
    res.redirect('/urls');
  } else {
    res.status(403).send("Error, invalid email / password");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  let templateVars = {
    users: usersDatabase,
    userID: req.session.userID
  };
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    res.render("register", templateVars);
  }
});
app.post("/register", (req, res) => {
  let user = generateRandomString();

  if (isEmailFree(req.body.email) && req.body.email !== "" &&
    req.body.password !== "") {
    usersDatabase[user] = {
      id: user,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10) // eslint-disable-line
    };

    req.session.userID = user;
    res.redirect("/urls");
  } else {
    res.status(400).send("Error, invalid email / password");
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (shortExists(req.params.shortURL)) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.status(404).send("This page does not exist"); // eslint-disable-line
  }
});

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
  return url.startsWith('http://') || url.startsWith('https://') ? url : `http://${url}`; // eslint-disable-line
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
  return bcrypt.compareSync(pass, usersDatabase[id].password); // eslint-disable-line
}

function shortExists(shortURL) {
  for (const key in urlDatabase) {
    if (key === shortURL) {
      return true;
    }
  }

  return false;
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

  return temp;
}