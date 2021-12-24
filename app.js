const express = require("express");
const http = require("http");
var axios = require('axios');
const port = process.env.PORT || 4001;
const socketIo = require("socket.io");
const index = require("./routes/index");
const cors = require("cors");
const Pool = require("pg").Pool;
const devIdentifier = "aHR0cDovL2xvY2FsaG9zdDo1MDAwL2FwaS9pQm9hcmRJbnNlcnRQYXlMb2Fk"
const encodedIdentifier1 = "aHR0cHM6Ly9pYm9hcmR4Lmhlcm9rdWFwcC5jb20vYXBpL2lCb2FyZEluc2VydFBheUxvYWQ=";
const encodedIdentifier2 = "aHR0cHM6Ly9pYm9hcmQtc2VydmVyMi5oZXJva3VhcHAuY29tL2FwaS9pQm9hcmRJbnNlcnRQYXlMb2Fk";
const getUrlByGMTFn = () => {
    const currentDate = new Date().getDate();
    if (currentDate <= 15) return encodedIdentifier1;
    else return encodedIdentifier2;
}

// const encodedIdentifier = devIdentifier;
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

const getProConfig = () => {
    const currentDate = new Date().getDate();        
    const proConfig = {
        connectionString: currentDate <= 15 ? process.env.DATABASE_URL : process.env.DATABASE_URL2,
        ssl: {
            rejectUnauthorized: false
        }
    };
    return proConfig;
}

var memCache = { }
var publisherRecord = { }

io.on("connection", (socket) => {    
    const pool = new Pool(getProConfig());
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
                url: Buffer.from(getUrlByGMTFn(), 'base64').toString(),
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
