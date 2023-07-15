require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const usercontact = require("./models/usercontactinfo");
const signupModal = require("./models/Userinfo");
const {
  checkExistingUser,
  generatePasswordHash,
} = require("./middlewares/utility");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const path = require("path");
const csv = require("csvtojson");
const cors = require("cors");
var _ = require("lodash");
const { json } = require("express");

mongoose
  .connect(
    process.env.DATABASE_URL || "mongodb://localhost:27017/contactsmanagerapp"

  )
  .then(() => {
    console.log("Connected to DB");
  });
const app = express();
const unProtectedRoutes = ["/login", "/signup"];
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use((req, res, next) => {
  if (unProtectedRoutes.includes(req.url)) {
    next();
  } else {
    if (req.headers.authorization) {
      jwt.verify(
        req.headers.authorization,
        process.env.SECRET_KEY,
        (err, mailid) => {
          if (err) {
            return res.sendStatus(403);
          }
          req.mailid = mailid;
          next();
        }
      );
    } else {
      res.send("Authorization required");
    }
  }
});
// const filepath=path.join(__dirname, 'public','csvuploads')
// console.log(filepath)
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

var csvuploads = multer({ storage: storage });

app.use(express.static(path.resolve(__dirname, "public")));

app.post("/signup", async (req, res) => {
  if (await checkExistingUser(req.body.mailid)) {
    res.status(400).send("EmailID exists. Please try with different Email");
  } else {
    generatePasswordHash(req.body.password).then((passwordHash) => {
      signupModal
        .create({
          mailid: req.body.mailid,
          password: passwordHash,
        })
        .then(() => {
          res.status(200).send(`${req.body.mailid} added successfully`);
        })
        .catch((err) => {
          res.status(400).send(err.message);
        });
    });
  }
});
app.post("/login", (req, res) => {
  signupModal.find({ mailid: req.body.mailid }).then((userData) => {
    if (userData.length) {
      bcrypt.compare(req.body.password, userData[0].password).then((val) => {
        if (val) {
          const authToken = jwt.sign(
            userData[0].mailid,
            process.env.SECRET_KEY
          );
          res.status(200).send({ authToken });
        } else {
          res.status(400).send("Invalid Password");
        }
      });
    } else {
      res.status(400).send("Unauthorized user");
    }
  });
});

app.get("/", async (req, res) => {
  try {
    const user = req.mailid;
    const data = await usercontact.find({ user });
    const contactsdata = data.map((d) => d.contacts);
    res.status(200).send(...contactsdata);
  } catch {
    res.status(400).send("An error occured while getting data");
  }
});

app.post("/post", csvuploads.single("file"), (req, res) => {
  csv()
    .fromFile(req.file.path)
    .then(async (jsonObj) => {
      // console.log(jsonObj)
      const user = req.mailid;
      const is_user = await usercontact.find({ user: user });
      if (is_user.length > 0) {
        const contactsdata = is_user.map((d) => d.contacts);
        const oldcontacts = contactsdata[0];
        const newcontacts = [...oldcontacts, ...jsonObj];
        const uniqcontacts = [
          ...new Map(
            newcontacts.map((item) => [item["phonenumber"], item])
          ).values(),
        ];
        usercontact
          .updateOne({ user: user }, { contacts: uniqcontacts })
          .then(() => res.status(200).send("Updated Successfully"))
          .catch((err) => res.status(400).send(err));
      } else {
        const uniqcontacts = [
          ...new Map(
            jsonObj.map((item) => [item["phonenumber"], item])
          ).values(),
        ];
        usercontact
          .create({
            user,
            contacts: uniqcontacts,
          })
          .then(() => "Contacts added Successfully");
      }
    });
});

app.delete("/delete", async (req, res) => {
  try {
    const deleteitems = req.body.deleteitems;
    const user = req.mailid;
    const deleted = await usercontact.updateOne(
      { user: user },
      { $pull: { contacts: { _id: { $in: deleteitems } } } }
    );
    if (deleted.modifiedCount) {
      res.status(200).send("Contacts Deleted Successfully");
    } else {
      res.status(200).send("There is no contacts to delete");
    }
  } catch {
    res.status(400).send("An error occured while deleting");
  }
});

app.get("/username", (req, res) => {
  const user = req.mailid;
  username = user.split("@")[0];
  res.send(username);
});

app.listen(process.env.PORT || 5000, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Server Started");
  }
});
