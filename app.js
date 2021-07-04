const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");

//route imports
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");

dotenv.config();

//Db connect
mongoose
  .connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));

//Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

//Route Middleware
app.use("/api/user", authRoute);
app.use("/api/posts", postRoute);

app.listen(3000, () => console.log("Server is running"));
