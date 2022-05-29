/*
Default return value for the handle* functions is
a 2-element array:
first element is a boolean - true if OK
second element is an object, which will be
appended into the final response.
*/

import { simpleAccept, simpleRefusal } from './tools.js';
let STATE = {};
let users = {};
let turn = null;
let timeout = -1;

function getOppositeID(id){
    return Object.values(users).filter(n => n !== id)[0];
}

export async function handleUserLogin( { username }, broadcastEvent, id ){
    const available = Object.keys(STATE);
    if(Object.keys(users).includes(username)){
        return simpleRefusal("This user already exists");
    }
    if(available.length === 2){
        return simpleRefusal("The maximal number of users has already been achieved");
    }
    STATE[id] = {
        colorPlaying: available.length == 0 ? "red": "black",
    };
    users[username] = id;

    broadcastEvent("C_USER_ADD", { username });

    if(Object.keys(STATE).length === 2){
        // OK, all the users have joined already. Start the game
        broadcastEvent("C_INIT", {
            ...STATE
        });
        broadcastEvent("C_TURN", { id, username });
        turn = id;
        if(timeout !== -1) clearTimeout(timeout);
        timeout = setTimeout(() => {
            const winnerTurn = getOppositeID(turn);
            broadcastEvent("C_WIN", { id: winnerTurn, username: Object.entries(users).find(n => n[1] === winnerTurn)[0] });
        }, 30000);
    }
    return simpleAccept();
}

export function handleReset(data, broadcastEvent){
    STATE = {};
    users = {};
    turn = null;
    console.log("RESET");
    if(timeout !== -1) {
        clearTimeout(timeout);
        timeout = -1;
    }
    return simpleAccept();
}

export function handleMove(data, broadcast){
    if(Object.keys(users).length !== 2) return simpleRefusal("You cannot play alone.");
    broadcast("C_MOVE", data);
    if(timeout !== -1) clearTimeout(timeout);
    timeout = setTimeout(() => {
        const oppositeID = getOppositeID(turn);
        broadcast("C_WIN", { id: oppositeID, username: Object.entries(users).find(n => n[1] === oppositeID)[0] });
    }, 30000);
    let info =  Object.entries(users).filter(([uname, id]) => id !== turn)[0];
    turn = info[1];
    let username = info[0];
    broadcast('C_TURN', {id: turn, username });
    return simpleAccept();
}

export function loopback(name){
    return (data, broadcast) => {
        broadcast(name, data);
        return simpleAccept();
    };
}

export function handleWin(data, broadcast, id){
    if(Object.keys(users).length !== 2) return simpleRefusal("You cannot play alone.");
    broadcast("C_WIN", { id, username: Object.entries(users).find(n => n[1] === id)[0] });
    return simpleAccept();
}
