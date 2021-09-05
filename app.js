const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();

// Init middleware
app.use(bodyParser.json({ extended: false }));
app.use(cors());
app.use(express.json());

//Connect DB
connectDB();

// Define routes
app.use("/api/user",require("./routes/api/user"));
app.use("/api/auth",require("./routes/api/auth"));
app.use("/api/teacher",require("./routes/api/teacher")); 
app.use('/api/assignment',require('./routes/api/assignment'));
// app.use('/api/studentresponse',require('./routes/api/studentresponse'));

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server is running at ${port}`));
