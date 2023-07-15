const signupModal = require("../models/Userinfo");
const bcrypt = require("bcryptjs");
const checkExistingUser = async (email) => {
  let existingUser = false;
  await signupModal.find({ mailid: email }).then((userData) => {
    if (userData.length) {
      existingUser = true;
    }
  });
  return existingUser;
};

const generatePasswordHash = (password) => {
  const salt = 10;
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(salt).then((hashSalt) => {
      bcrypt.hash(password, hashSalt).then((passwordHash) => {
        resolve(passwordHash);
      });
    });
  });
};
module.exports = { checkExistingUser, generatePasswordHash };
