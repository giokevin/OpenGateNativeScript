const observableModule = require("tns-core-modules/data/observable");

function HomeViewModel() {
    const viewModel = observableModule.fromObject({

        imageurl: "~/images/canzello0.png",
        autoOpenGate: false,
        logs: [
            { title: "Applicazione partita..." },
        ],
        goingToLock: false,
        changingGate: false,
        autoOpenGateForced : false


    });

    return viewModel;
}

module.exports = HomeViewModel;


