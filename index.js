require('dotenv').config();

const express = require("express");
const cors = require('cors');
const app = express();
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const username = "apitest";
const password = "test123";
var token = 0;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-credentials", true);
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH");
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
    res.send("Hello World-20-7");
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
    var _base64 = "";
    var result = "";

    try {
        //Postman
        try {
            _base64 = req.header('Authorization').split(" ")[1];
        } catch(e){}

        //Local
        try {
            if (_base64 == "") { _base64 = req.headers.authorization.split(" ")[1]; }
        } catch(e){}

        //Render.com
        try {
            if (_base64 == "") { _base64 = req.body.authorization.split(" ")[1]; }
        } catch(e){}
        
        if (_base64 != "") {
            const _buffer = Buffer.from(_base64, 'base64').toString().split(":");
            
            if (username == _buffer[0] &&
                password == _buffer[1]){
                const d = new Date();
                
                token = d.getTime();

                result = JSON.stringify({
                    "response": token,
                    "messages": [{ "code": "0", "message": "OK" }]
                });
            }
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
    } catch (error) {
        res.writeHead(400, 'Error has occured');
    } finally {
        res.write(result);
        res.end();
    }
})

app.post("/upsert", async (req, res) => {
    var _token = "";
    var result = "";

    try {
        //Postman and Local
        try{
            _token = req.header('authorization').split(" ")[1];
        } catch(e){}
        
        //Render.com
        try {
            if (_token == "") { _token = req.body.authorization }
        } catch(e){}

        console.log(_token);
        
        if (_token == token){
            //const { sub0, sub1, sub2, debit } = req.body;

            //console.log(sub0 + " ; " + sub1 + " ; " + sub2 + " ; " + debit);

            /*const checkTable = "CREATE TABLE IF NOT EXISTS DebitTable (id SERIAL PRIMARY KEY, sub0 smallserial, sub1 smallserial, sub2 smallserial, debit NUMERIC(12, 2));";
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

            result = JSON.stringify({
                'response': { 'script': 'upsert' },
                'messages': [{ 'code': '0', 'message': 'OK' }]
            });
        }else{
            throw err;*/
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
    } catch (error) {
        res.writeHead(400, 'Error has occured');
    } finally {
        token = 0;
        res.write(result);
        res.end();
    }
})

app.patch('/getData', async (req, res) => {
    var _token = "";
    var result = "";

    try {
        //Postman and Local
        try{
            _token = req.header('authorization').split(" ")[1];
        } catch(e){}
        
        //Render.com
        try {
            if (_token == "") { _token = req.body.authorization }
        } catch(e){}
        
        const _script = req.body.script;

        if (_token == token){
            if (_script == "getData"){
                const rows = (await pool.query("SELECT * FROM DebitTable")).rows;

                result = JSON.stringify({
                    "response": rows,
                    "messages": [{ "code": "0", "message": "OK" }]
                });
            } else {
                throw err;
            }
        }else{
            throw err;
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
    } catch (error) {
        res.writeHead(400, 'Error has occured');
    } finally {
        token = 0;
        res.write(result);
        res.end();
    }
})

app.listen(5000, () => console.log('Server is running on port 5000'));