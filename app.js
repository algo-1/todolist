const express = require("express");                       
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();
app.use(bodyparser.urlencoded({extended : true}));
app.use(express.static("public"));
app.set("view engine", "ejs");         

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});
// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
mongoose.set('useFindAndModify', false);

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

// get methods
app.get("/", function(req, res){
    Item.find({}, function(err, foundItems){
        let day = date.getDate();
        res.render("list", {listTitle: day, items: foundItems});
    });
    
    
});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName); // capitalizes only first letter
    List.findOne({name: customListName}, function(err, foundList){
        if (!err) {
            if (!foundList) {
                // Create a new list 
                const list = new List ({
                    name: customListName,
                    items: []
                });
            
                list.save();
                res.redirect("/"+ customListName);
            } else {
                // Show an existing list
                res.render("list", {listTitle: foundList.name, items: foundList.items})
            }
        }
    });
  
});

// post methods
app.post("/", function(req, res){
    const itemValue = req.body.newItem;
    const listName = req.body.list;

    List.findOne({name: listName}, function(err, foundList){
        if (foundList) {
                const item = new Item({
                    name: itemValue
                });
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + foundList.name);
        }   else {
                const item = new Item({
                    name: itemValue
                });
                item.save();
                res.redirect("/");
            }    
    });
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.list;

    List.findOne({name: listName}, function(err, foundList){
        if (foundList) {
            List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
                if (!err) {
                    res.redirect("/" + listName);
                }
            });
        }   else {
                Item.findByIdAndDelete(checkedItemId, function(err) {
                    if (!err) {
                        res.redirect("/");
                    }
            });
        }
    });
});

app.listen(3000, function(){                             // (3000 || process.env.PORT) for heroku deployment
    console.log("server started on port 3000");
});