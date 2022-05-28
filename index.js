import express from "express";
import { randomUUID } from 'crypto'

import { handleMove, handleReset, handleUserLogin, handleWin, loopback } from "./handlers.js";
import { simpleAccept } from "./tools.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.static("static"));

const HANDLERS = {
    "USER_LOGIN": handleUserLogin,
    "RESET": handleReset,
    "REMOVE": loopback("C_REMOVE"),
    "MOVE": handleMove,
    "I_WON": handleWin,
};

let eventsList = [];

function broadcast(type, data){
    eventsList.push({ type, 
        data: (typeof data === "function" ? data() : data)
    });
}

app.post("/event", async (req, res) => {
    if(!req.body){
        res.json({ok: false, data: {reason: "Missing body"}});
        return;
    }
    const { type, data, id } = req.body;
    if(type === "RESET") eventsList = [];
    if(Object.keys(HANDLERS).includes(type)){
        const [success, newData] = await HANDLERS[type](data, broadcast, id);
        res.json({ok: success, data: newData });
    }else{
        res.json({ok: false, data: {reason: "Invalid event type"}});
    }
});

app.get("/events", async (req, res) => {
    res.json(eventsList);
});

app.get("/handshake", (req, res) =>{
    res.json({ok: true, data: {id: randomUUID()}});
})

app.listen(process.env.PORT || 3000);
