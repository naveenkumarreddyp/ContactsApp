const mongoose= require('mongoose');

const contactinfo=new mongoose.Schema({
    name:{type:String,required:true},
    designation:{type:String,required:true},
    company:{type:String,required:true},
    industry:{type:String,required:true},
    email:{type:String,required:true},
    phonenumber:{type:String,required:true},
    country:{type:String,required:true},
})
 
const usercontactinfo=new mongoose.Schema({
    contacts:[contactinfo],
    user:{type:String,required:true}
})

const usercontact = mongoose.model("UserContactInfo", usercontactinfo)
module.exports=usercontact;