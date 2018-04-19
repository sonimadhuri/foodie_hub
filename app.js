var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    Restaurant= require("./models/restaurants"),
    Review = require("./models/reviews");
    const fileUpload = require('express-fileupload');
    mongoose.connect("mongodb://localhost/foodie_hub_2");
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
var $;
var values = {};
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
require("jsdom/lib/old-api").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }
     $ = require("jquery")(window);
});
app.use(fileUpload());
//=====================
// ROUTES
//=====================

app.get("/",function(req,res){
  var url="https://raw.githubusercontent.com/nshntarora/Indian-Cities-JSON/master/cities-name-list.json";
  $.getJSON( url, {
    format: "json"
  })
    .done(function( data ){
        data.sort();
         res.render("index",{cities:data});
    });
  });
//display the list of restaurants
app.post("/restaurants",function(req,res){
  var body = req.body;
   values = {};
   var url="https://api.foursquare.com/v2/venues/explore?near="+req.body.location+"&section=food&oauth_token=ONFATKYVWVW23QHZYDH0FA4OLXTS31GCEIWI1WYPNRMCREMN&v=20180417";
    $.getJSON(url,{
        format:"json"
    }).done(function(data){
        Object.assign(values,data);
        //console.log(values.response.groups.items[0].venue.name);
        //res.send("eb");
      res.render("restaurants",{body:body,values:values});
    });
});
// dispay more info about a restaurant
app.get("/restaurants/:id/more_info",function(req,res){
  var items=values.response.groups[0].items;
  var datas ={};
  for(var i=0;i<items.length;i++){
    if(items[i].venue.id == req.params.id){
      Object.assign(datas,items[i]);
      break;
    }
  }
  let review;
  Review.find({id:req.params.id},function(err,reviews){
    if(err){
      console.log(err);
    } else {
      //review = JSON.parse(reviews);
      review = reviews;
    }
  });
  let imageURL,prefix,suffix;
  var url="https://api.foursquare.com/v2/venues/"+req.params.id+"/photos?&oauth_token=ONFATKYVWVW23QHZYDH0FA4OLXTS31GCEIWI1WYPNRMCREMN&v=20180417";
  $.getJSON(url,{
    format:"json",
  }).done(function(data){
    prefix = data.response.photos.items[0].prefix;
    suffix = data.response.photos.items[0].suffix;
    imageURL = prefix+"500x500"+suffix;
    res.render("more_info",{item:datas,imageURL:imageURL,review:review});
  });
});
// form to add in new restaurant to database
app.get("/restaurants/new",function(req,res){
  res.render("new");
});
//actual addition to DB
app.post("/restaurants/add",function(req,res){
   var newRestaurant = req.body;
   var Restro = new Restaurant();
   //console.log(newRestaurant);
  // console.log(req.files);
   Restro.name = newRestaurant.name;
   Restro.city = newRestaurant.city;
   Restro.address = newRestaurant.address;
   Restro.rating = newRestaurant.rating;
   Restro.category = newRestaurant.category;
   Restro.review = newRestaurant.review;
   Restro.img = newRestaurant.name+".jpg";
  if(!req.files){
     return res.status(400).send('No files were uploaded.');
   }
   let sampleFile = req.files.file;
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('./uploads/'+newRestaurant.name+'.jpg', function(err) {
    if (err)
      return res.status(500).send(err);
    //res.send('File uploaded!');
  });
  Restro.save();
  res.send("tada");
});
let currentId;
app.get("/restaurants/:id/addReview",function(req,res){
  currentId = req.params.id;
  res.render("addReview");
});
app.post("/addReview",function(req,res){
  let id=currentId;
  let rating = req.body.rating;
  let review = req.body.review;
  let name = req.body.name;
  var Reviews = new Review();
  Reviews.id=id;
  Reviews.rating = rating;
  Reviews.review=review;
  Reviews.name = name;
  Reviews.save();
  res.redirect("/restaurants/"+currentId+"/more_info");
});
//SETUP
app.listen(process.env.PORT,process.env.IP,function(){
  console.log("server started");
});