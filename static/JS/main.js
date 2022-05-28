import Game from "./Game.js";
import Net from "./Net.js";
import Ui from "./UI.js";

window.onload = () => {
   window.game = new Game();
   window.net = new Net();
   window.ui = new Ui();
};

window.tryInit = async (username) => {
   try{
      window.net.ownName = username;
      await window.net.sendEvent("USER_LOGIN", { username: username });
   }catch({message}){
      window.net.ownName = null;
      alert(message);
      return;
   }
   window.ui.notify("Waiting for other users", true);
   window.ui.closeLogin();
}