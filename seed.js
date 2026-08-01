const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const courseSchema = new mongoose.Schema({
    id: Number,
    title: String,
    price: Number,
    instructor: String
});

const Course = mongoose.model("Course", courseSchema);

async function seedDB() {
    try {
        const filePath = path.join(__dirname, "data.json");

        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

        await Course.deleteMany();

        await Course.insertMany(data);

        console.log("✅ Data Inserted Successfully");

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedDB();