require('dotenv').config();

const cors = require('cors');
const express = require("express");
const app = express();
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});


var token = 0;
const username = "apitest";
const password = "test123";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://odev-server.onrender.com/test');
    next();
});

pool.connect((err) => {
    try {
        console.log("Database Connection : OK");
    } catch (error) {
        console.log("Database Connection : " + err.message);
    }
})

app.get("/test", (req, res) => {
    res.send("Hello World-17");
})

app.get("/tables", async (req, res) => {
    try {
        const rows = (await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).rows;

        res.json({msg: "OK", data: rows});
    } catch (error) {
        res.json({msg: error.msg});
    }
})

app.get("/dropTable", async (req, res) => {
    try {
        const rows = (await pool.query("DROP TABLE DebitTable")).rows;

        res.json({msg: "OK", data: rows});
    } catch (error) {
        res.json({msg: error.msg});
    }
})

app.post("/token", async (req, res) => {
    try {
        const _base64 = req.header('authorization').split(" ")[1];
        const _buffer = Buffer.from(_base64, 'base64').toString();
        const _username = _buffer.split(":")[0];
        const _password = _buffer.split(":")[1];

        if (_username == username &&
            _password == password){
            const d = new Date();
            
            token = d.getTime();
            res.json(
            {
                "response": { "token": token },
                "messages": [{ "code": "0", "message": "OK" }]
            });
        }
    } catch (error) {
        res.json({msg: error.msg});
    }
})

app.post("/upsert", async (req, res) => {
    try {
        const _token = req.header('authorization').split(" ")[1];

        if (_token == token){
            const { sub0, sub1, sub2, debit } = req.body;

            const checkTable = "CREATE TABLE IF NOT EXISTS DebitTable (id SERIAL PRIMARY KEY, sub0 smallserial, sub1 smallserial, sub2 smallserial, debit NUMERIC(12, 2));";
            const checkQuery = "SELECT * FROM DebitTable WHERE sub0="+ sub0 +" AND sub1="+ sub1 +" AND sub2="+ sub2;
            const updateQuery = "UPDATE DebitTable SET debit="+ debit +" WHERE sub0="+ sub0 +" AND sub1="+ sub1 +" AND sub2="+ sub2;
            const insertQuery = "INSERT INTO DebitTable (sub0, sub1, sub2, debit) VALUES ("+ sub0 +", "+ sub1 +", "+ sub2 +", "+ debit +")";
            const ifQuery = `
                DO $$
                    BEGIN
                    ${checkTable}
                    CASE
                        WHEN EXISTS(${checkQuery}) THEN
                            ${updateQuery};
                        ELSE
                            ${insertQuery};
                    END CASE;
                END $$;
            `;
    
            await pool.query('BEGIN');
            await pool.query(ifQuery);
            await pool.query('COMMIT');

            res.json({
                "response": { "script": "upsert" },
                "messages": [{ "code": "0", "message": "OK" }]
            });
        }else{
            throw err;
        }
    } catch (error) {
        res.json({msg: error.msg});
    } finally {
        token = 0;
    }
})

app.patch("/getData", async (req, res) => {
    try {
        const _token = req.header('authorization').split(" ")[1];
        const _script = req.body.script;

        if (_token == token){
            if (_script == "getData"){
                const rows = (await pool.query("SELECT * FROM DebitTable")).rows;

                res.json({
                    "response": rows,
                    "messages": [{ "code": "0", "message": "OK" }]
                });
            } else {
                throw err;
            }
        }else{
            throw err;
        }
    } catch (error) {
        res.json({msg: error.msg});
    } finally {
        token = 0;
    }
})

app.listen(process.env.PORT, () => console.log("Server is running on port 5000"));