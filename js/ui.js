import { startGame } from "./main.js";

const playBtn = document.getElementById("playBtn");

playBtn.addEventListener("click", () => {

    document.getElementById("menu").style.display = "none";

    startGame();

});
