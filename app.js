const express = require("express");
const http = require("http");
var axios = require('axios');
const port = process.env.PORT || 4001;
const socketIo = require("socket.io");
const index = require("./routes/index");
const cors = require("cors");
const Pool = require("pg").Pool;
const encodedIdentifier = "aHR0cHM6Ly9pYm9hcmR4Lmhlcm9rdWFwcC5jb20vYXBpL2lCb2FyZEluc2VydFBheUxvYWQ=";
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

var memCache = { }
var publisherRecord = { }

io.on("connection", (socket) => {
    const pool = new Pool(proConfig);
    console.log("New client connected");
    socket.on("getDataFromUniqueId", (data) => {
        let query = `SELECT * FROM i_board WHERE Board_id='${data.toUpperCase()}';`;
        if (memCache[data]) {
            socket.emit("respondData", memCache[data]);
        } else {
            pool.query(query, (err, res) => {
                if (res) {
                    if (res.rows.length > 0) {
                        memCache[data] = res.rows[0].board_text;
                        socket.emit("respondData", res.rows[0].board_text);
                    }
                    else { socket.emit("respondData", "There is No Data inserted for this id."); }
                } else {
                    socket.emit("respondData", "Error Occured 😢.");
                }
            })
        }
    });

    socket.on("publishData", (data) => {
        memCache[data[0]] = data[1];
    });

    socket.on("disconnect", (config) => {
        pool.end();
        console.log("Client disconnected");
    });
});


server.listen(port, () => {
    console.log(`Listening on port ${port}`)
    setInterval(() => {
        for (var uniqueId in memCache) {
            const config = {
                method: 'POST',
                url: Buffer.from(encodedIdentifier, 'base64').toString(),
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ "uniqueId": uniqueId, "payLoad": memCache[uniqueId] })
            };
            axios(config)
                .then((response) => { })
                .catch((error) => {
                    console.log("Error occured");
                });
        }
    }, 5000);
});
