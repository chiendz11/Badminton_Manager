const express = require('express');
const app = express();
const connectDB = require("./config/Mongodb");
const testInsertRating = require("./controllers/ratingController");

// Kết nối database khi server khởi động

connectDB();

testInsertRating();
app.get('/', (req, res) => {
    res.send('Hello from Express server');
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});
