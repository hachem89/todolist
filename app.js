const express = require("express"); //require express
const bodyParser = require("body-parser"); //require body-parser
const mongoose = require("mongoose"); //require mongoose
// const date = require(__dirname + "/date.js"); //require the file that contains date fonctions
const _ = require("lodash"); //require lodash

const app = express(); //use express

app.use(bodyParser.urlencoded({ extended: true })); // for parsing data
app.use(express.static("public")); //for CSS
app.set("view engine", "ejs"); // for EJS

//DATABASE:

mongoose.connect(
  "mongodb+srv://admin-hachem:hafet1966@cluster0.b90jigs.mongodb.net/todoListDB"
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

//CREATE SCHEMA FOR CUSTOM LIST:
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

//----------------ROUTE LIST------------\\

app.get("/", (req, res) => {
  // let day = date.getDate();
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length == 0) {
        Item.insertMany(defaultItems)
          .then(() => res.redirect("/"))
          .catch((err) => console.log(err));
      } else {
        //render list.ejs
        res.render("list", {
          listTitle: /*day*/ "Today",
          newListItems: foundItems,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

//------POST REQUEST FROM ROUTE LIST ELSE CUSTOM LIST--------\\

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    if (item.name != "") {
      item
        .save()
        .then(() => res.redirect("/"))
        .catch((err) => console.log(err));
    }
  } else {
    if (item.name != "") {
      List.findOne({ name: listName })
        .then((foundList) => {
          foundList.items.push(item);
          foundList
            .save()
            .then(() => res.redirect("/list/" + listName))
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
    }
  }
});

//----------DELETING FROM ROUTE LIST ELSE CUSTOM LIST---------\\

app.post("/delete", (req, res) => {
  const listName = req.body.deleteFromList;
  const idOfItem = req.body.checkbox;
  if (listName === "Today") {
    Item.findByIdAndRemove(idOfItem)
      .then(() => res.redirect("/"))
      .catch((err) => console.log(err));
  } else {
    // METHODE1:
    // List.findOne({ name: listName })
    //   .then((foundList) => {
    //     foundList.items.pull({ _id: idOfItem });
    //     foundList.save();
    //   })
    //   .catch((err) => console.log(err));
    // res.redirect("/list/"+listName);
    //METHODE 2:
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: idOfItem } } }
    )
      .then(() => res.redirect("/list/" + listName))
      .catch((err) => console.log(err));
  }
});

//------------CREATING CUSTOM LISTS with express route parameters---------\\

app.get("/list/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList) {
        //show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      } else {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list
          .save()
          .then(() => res.redirect("/list/" + customListName))
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.log(err));
});

//---------------ABOUT PAGE-----------------\\

app.get("/about", (req, res) => {
  res.render("about");
});

//--------------STARTING SERVER-------------\\
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started on port 3000");
});
