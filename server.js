const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");

const connectDB = require("./config/db");
const doctorRoutes = require("./routes/doctorRoutes");
dotenv.config();
console.log(process.env.MONGO_URI);

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Doctor Booking API Running");
});

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.use("/api/doctors", doctorRoutes);