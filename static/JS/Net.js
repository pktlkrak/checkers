export default class Net{
    numberOfEvents = 0;
    locked = false;
    constructor(){
        this.HANDLERS = {
            "C_INIT": this.handleInitAll.bind(this),
            "C_USER_ADD": this.handleAddUser.bind(this),
            "C_RESET": this.handleReset.bind(this),
            "C_MOVE": this.handleMove.bind(this),
            "C_REMOVE": this.handleRemove.bind(this),
            "C_TURN": this.handleTurn.bind(this),
            "C_WIN": this.handleWin.bind(this),
        };
        this._initCommunication().then(setInterval(this.pollEvent.bind(this), 200));
        this.myTurn = false;
    }

    handleWin( { id, username } ){
        this.locked = true; // Perma-lock all the network handlers.
        debugger;
        window.ui.stopIntervals();
        if(this.id === id){
            window.ui.notify("Congratulations! You won!", true);
        }else if(window.game.colorName !== "spectator"){
            window.ui.notify("Too bad, you lost", true);
        }else{
            window.ui.notify(`Game Over, ${username} won!`, true);
        }
    }

    handleTurn({ id }){
        this.myTurn = this.id === id;
        window.ui.showPlayingAs(window.game.colorName, this.myTurn);
    }

    handleMove({ from, to }){
        window.game.getPawnAt(...from)?.setPositionOnBoard(...to);
    }

    handleRemove({ at }){
        window.game.getPawnAt(...at)?.removeFromField();
    }

    reset(){
        this.sendEvent("RESET", {});
    }

    async pollEvent(){
        let fromServer = await (await fetch('/events')).json();
        if(this.numberOfEvents > fromServer.length) window.location.reload();

        for(let i = this.numberOfEvents; i<fromServer.length; i++){
            if(this.locked) return;
            const { type, data } = fromServer[i];
            console.log(`[Net]: Handling event ${type}`);
            this.HANDLERS[type](data);
        }
        this.numberOfEvents = fromServer.length;
    }

    async sendEvent(type, content){
        if(this.locked && type !== "RESET") return;
        const event = { type, data: content, id: this.id };
        const resp = await fetch("/event", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
        });
        const response = await resp.json();
        const {ok, data} = response;
        if(!ok){
            throw new Error(data.reason);
        }
        return data;
    }

    async _initCommunication(){
        let resp = await fetch("/handshake", {
            method: "GET",
            credentials: "same-origin",
        });
        let json = await resp.json();
        this.id = json.data.id;
    }


    handleInitAll(data){
        let color = data[this.id]?.colorPlaying;
        console.log(`I am ${color}`);
        window.game.initPositions( color || null );
        ui.closeLogin();
    }

    handleAddUser( {username} ){
        if(username !== this.ownName) this.opponentName = username;
        console.log(`New user has joined: ${username}`);
    }

    handleReset(){
    }
}