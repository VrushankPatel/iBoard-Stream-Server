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
    connectionString: "postgres://urblfooqaxzsvi:d81f89e197a21d0270f815c886781fe451eaa4af6cdf4f696b2a38852c238a05@ec2-52-45-183-77.compute-1.amazonaws.com:5432/d6ikpi8if3aso7",
    ssl: {
        rejectUnauthorized: false
    }
}
const pool = new Pool(proConfig);
let interval;
io.on("connection", (socket) => {
    console.log("New client connected" + socket);
    if (interval) {
        clearInterval(interval);
    }
    socket.on("getUniqueId", (data) => {
        let query = `SELECT * FROM i_board WHERE Board_id='${data}';`

        pool.query(query, (err, res) => {
            if (res) {
                socket.emit("FromAPI", res.rows[0].board_text);
            } else {
                socket.emit("FromAPI", "Error Occured 😢.");
            }
        })
        // pool.end();
    });
    interval = setInterval(() => getApiAndEmit(socket), 1000);
    socket.on("disconnect", (config) => {
        console.log("Client disconnected");
        clearInterval(interval);
    });
});

const getApiAndEmit = socket => {
    const response = new Date();
    socket.emit("respondData", response);
};

server.listen(port, () => console.log(`Listening on port ${port}`));