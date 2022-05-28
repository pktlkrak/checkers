export default class UI{
    constructor(){
        this.infobox = document.querySelector("#rootinfo");
        this.tempInterval = -1;
    }

    showInfobox(){
        this.infobox.classList.remove("hidden");
    }

    notify(data, modal=false){
        this.infobox.querySelector("span").innerHTML = "";
        this.infobox.querySelector("span").innerText = data;
        if(modal)
            this.infobox.classList.add('fullscreen');
        else
            this.infobox.classList.remove('fullscreen')
        this.showInfobox();
    }

    showPlayingAs(name, myTurn){
        if(this.tempInterval !== -1) clearInterval(this.tempInterval);
        this.closeLogin();
        let time = 30;
        
        const temp =( ) => {
            this.notify(`You are playing as the ${name}. ${myTurn ? "It is now your turn." : `It's now ${window.net.opponentName}'s turn.`} ${myTurn ? "You have " : "They have "} ${time} more seconds.`, !myTurn && window.game.colorName !== "spectator");
            time -= 1;
        }
        temp();
        this.tempInterval = setInterval(temp, 1000);
    }

    stopIntervals(){
        if(this.tempInterval !== -1){
            clearInterval(this.tempInterval);
            this.tempInterval = -1;
        }
    }

    closeLogin(){
        document.getElementById("login-data")?.remove();
    }
}
