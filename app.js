const express = require("express");
const http = require("http");
const port = process.env.PORT || 4001;
const socketIo = require("socket.io");
const index = require("./routes/index");
const cors = require("cors");
const Pool = require("pg").Pool;

const app = express();
app.use(cors());
app.use(index);

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const proConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
}
io.on("connection", (socket) => {
    const pool = new Pool(proConfig);
    console.log("New client connected");
    socket.on("getUniqueId", (data) => {
        let query = `SELECT * FROM i_board WHERE Board_id='${data}';`

        pool.query(query, (err, res) => {
            if (res) {
                socket.emit("respondData", res.rows[0].board_text);
            } else {
                socket.emit("respondData", "Error Occured 😢.");
            }
        })
    });
    socket.on("disconnect", (config) => {
        pool.end();
        console.log("Client disconnected");
    });
});


server.listen(port, () => console.log(`Listening on port ${port}`));