const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
dotenv.config();

const app = express();

app.use(express.json());

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlas Connected"))
    .catch((err) => {
        console.log("❌ MongoDB Connection Failed");
        console.error(err);
    });
//User Schema 
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model("User", userSchema);
//Hash Password
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }
});
//login
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({
                message: "Invalid Username or Password"
            });
        }

        // Compare Password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid Username or Password"
            });
        }

        res.json({
            message: "Login Successful"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }
});
app.get("/login", (req, res) => {
    res.send("Login API is working. Use POST /login.");
});
// Course Schema
const courseSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    instructor: {
        type: String,
        required: true
    }
});

const Course = mongoose.model("Course", courseSchema);

// Validation Middleware
function validateCourse(req, res, next) {
    const { id, title, price, instructor } = req.body;

    if (!id || !title || !price || !instructor) {
        return res.status(400).json({
            message: "Invalid Course Details"
        });
    }

    if (price <= 0) {
        return res.status(400).json({
            message: "Price must be greater than zero"
        });
    }

    next();
}

// Home Route
app.get("/", (req, res) => {
    res.send("Hello, World!");
});

// Get All Courses / Filter by Instructor
app.get("/api/courses", async (req, res) => {
    try {
        const filter = {};

        if (req.query.instructor) {
            filter.instructor = {
                $regex: req.query.instructor,
                $options: "i"
            };
        }

        const courses = await Course.find(filter);

        res.json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error fetching courses"
        });
    }
});
//Find my id and delete
app.delete("/api/courses/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const deletedCourse = await Course.findOneAndDelete({ id });

        if (!deletedCourse) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.status(200).json({
            message: "Course deleted successfully",
            course: deletedCourse
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
});
app.put("/api/courses/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const updatedCourse = await Course.findOneAndUpdate(
            { id }, 
            req.body,
            {
                new: true,
                runValidators: true
            }
        );
        if (!updatedCourse) {
            return res.status(404).json({
                message: "Course not found"
            });
        }
        res.status(200).json({
            message: "Course updated successfully",
            course: updatedCourse
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
});


// Get Course By ID
app.get("/api/courses/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const course = await Course.findOne({ id });

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.json(course);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

// Add Course
app.post("/api/courses", validateCourse, async (req, res) => {
    try {
        const { id, title, price, instructor } = req.body;

        const existingCourse = await Course.findOne({ id });

        if (existingCourse) {
            return res.status(400).json({
                message: "Course ID already exists"
            });
        }

        const course = await Course.create({
            id,
            title,
            price,
            instructor
        });

        res.status(201).json(course);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

// Update Course
app.put("/api/courses/:id", validateCourse, async (req, res) => {
    try {
        const id = Number(req.params.id);

        const updatedCourse = await Course.findOneAndUpdate(
            { id },
            req.body,
            {
                new: true
            }
        );

        if (!updatedCourse) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.json(updatedCourse);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

// Partial Update
app.patch("/api/courses/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const updatedCourse = await Course.findOneAndUpdate(
            { id },
            req.body,
            {
                new: true
            }
        );

        if (!updatedCourse) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.json(updatedCourse);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

// Delete Course
app.delete("/api/courses/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const deletedCourse = await Course.findOneAndDelete({ id });

        if (!deletedCourse) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.json({
            message: "Course deleted successfully",
            course: deletedCourse
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

// Seed Database
app.post("/seed", async (req, res) => {
    try {
        const filePath = path.join(__dirname, "data.json");

        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

        await Course.deleteMany();

        const courses = await Course.insertMany(data);

        res.status(201).json({
            message: "Database seeded successfully",
            count: courses.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error seeding database"
        });
    }
});

// Fetch Users
async function getUsers() {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");
        const users = await response.json();

        console.log("Users:");
        users.forEach((user) => console.log(user.name));
    } catch (err) {
        console.error(err);
    }
}

getUsers();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});