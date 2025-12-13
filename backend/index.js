const Server = require('./src/server.js');



function main() {
    let server = new Server(3001);//on peux ajouter un autre numéro de port
    server.start();// on peux ajouter une fonction de callback

}
main();
