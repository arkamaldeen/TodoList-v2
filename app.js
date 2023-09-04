const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
mongoose.connect("mongodb+srv://admin-kamaldeen:admin@cluster0.liosypq.mongodb.net/todolistDB")

const itemSchema = new mongoose.Schema({
    name: String
})

const Item = mongoose.model("Item", itemSchema)

const item1 = new Item({
    name: "Welcome to your todolist!"
})

const item2 = new Item({
    name: "Hit the + button to add a new item"
})

const item3 = new Item({
    name: "<-- Hit this to delete an item "
})

const defaultItem = [item1, item2, item3];

async function defaultItemCreation() {
    try {
        await Item.insertMany(defaultItem);
        console.log("Items inserted successfully");
    }
    catch (err) {
        console.log(err);
    }
}

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model("List", listSchema);



app.get("/", function (req, res) {

    async function displayItems() {
        try {
            const foundItems = await Item.find({});

            if (foundItems.length === 0) {
                defaultItemCreation();
                res.redirect("/");
            }

            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
        catch (err) {
            console.log(err);
        }
    }

    displayItems();

});


app.get("/:customListName", function (req, res) {

    async function customList() {
        try {
            const customListName = _.capitalize(req.params.customListName);
            const foundList = await List.findOne({ name: customListName })
            if (foundList === null) {
                const list = new List({
                    name: customListName,
                    items: defaultItem
                })

                await list.save();
                res.redirect("/" + customListName);
                console.log("Doesnt exist");
            }
            else {
                res.render("list", { listTitle: customListName, newListItems: foundList.items });
                console.log("Does exist");
            }


        }
        catch (err) {
            console.log(err);
        }
    }

    customList();


});


app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    async function pushItems() {
        try {
            const item = new Item({
                name: itemName
            });

            if (listName === "Today") {
                await item.save();
                console.log("item saved in database");
                res.redirect("/");
            }
            else {
                const foundList = await List.findOne({ name: listName });
                foundList.items.push(item);
                foundList.save();
                console.log("item saved in List database");
                res.redirect("/" + listName);
            }


        } catch (err) {
            console.log(err);
        }
    }

    pushItems();

})

app.post("/delete", function (req, res) {
    const checkItemId = req.body.checkbox;
    const checkListName = req.body.listName;

    async function deleteItem() {
        try {

            if (checkListName === "Today") {
                await Item.deleteOne({ _id: checkItemId });
                console.log("Deleted item from database ");
                res.redirect("/");
            }
            else {
                await List.findOneAndUpdate({name: checkListName}, {$pull: { items: {_id: checkItemId}}});
                res.redirect("/" + checkListName);
            }
        }
        catch (err) {
            console.log(err);
        }
    }

    deleteItem();
    

    
})



app.get("/about", function (req, res) {
    res.render("about");
})

app.listen(3000, function () {
    console.log("listening on port 3000");
})