const mongoose = require('mongoose');

const userinfo = new mongoose.Schema({
    mailid:{type:String,required:true},
    password:{type:String,required:true}
})

const user = mongoose.model('Userinfo', userinfo);
module.exports=user;