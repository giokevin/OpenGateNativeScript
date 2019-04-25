const HomeViewModel = require("./home-view-model");
var geolocation = require("nativescript-geolocation");
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
//const ObservableModule = require("tns-core-modules/data/observable");
const listViewModule = require("tns-core-modules/ui/list-view");
const Label = require("tns-core-modules/ui/label").Label;
var dialogs = require("tns-core-modules/ui/dialogs");

const application = require("tns-core-modules/application");
var activity = application.android.startActivity || application.android.foregroundActivity;
var mSensorManager = activity.getSystemService(android.content.Context.SENSOR_SERVICE);
var SecureStorage = require("nativescript-secure-storage").SecureStorage;
var secureStorage = new SecureStorage();
const http = require("http");

//importanti per il sensore magnetico di android
//https://medium.com/@ssaurel/learn-to-create-a-magnetometer-metal-detector-on-android-51a73011e4ea
//https://stackoverflow.com/questions/53136683/accessability-of-native-sensors-in-nativescript
//https://www.typescriptlang.org/play/
//https://docs.nativescript.org/ns-framework-modules/application#application-module-ios-specific-properties
//https://developer.android.com/reference/android/hardware/SensorManager

let page;
let logs;
let activateZone;
let safeZone;
let gate;
let generalArgs;
const timeToOpenGate = 16;

function manageSwitch(){

    const mySwitch = page.getViewById("switch");

    mySwitch.on("checkedChange", (args) => {

        page.bindingContext.set('autoOpenGate',args.object.checked);

        if (args.object.checked){
            getLocation(false);
        }
        else {
            geolocation.clearWatch(watchId);
        }


    });
}

function manageImage(){

    const image = page.getViewById("image");
    image.on("tap", (data) => {

        if (page.bindingContext.get('autoOpenGate')){
            alert("Ehi ehi esiste già una gestione automatica disattiva quella prima!");
        }
        else if (page.bindingContext.get('changingGate')) {
            alert("Operazione in corso sul cancello...Attendi la chiusura del cancello!");
        }
        else {
            manageGate();
        }


    });
}

function manageLogList(){

    const container = page.getViewById("container");

    logs = new ObservableArray([
        { title: "Applicazione partita..." },
    ]);
    const listView = new listViewModule.ListView();

    listView.className = "list-group";
    listView.items = logs;
    listView.on(listViewModule.ListView.itemLoadingEvent, (args) => {

        if (typeof logs.getItem(args.index) != "undefined" ) {
            if (!args.view) {
                args.view = new Label();
                args.view.className = "list-group-item";
            }
            (args.view).text =  logs.getItem(args.index).title;
        }


    });

    container.addChild(listView);
}


function manageLocations() {

    activateZone = secureStorage.getSync({key: "activateZone"});
    safeZone = secureStorage.getSync({key: "safeZone"});
    gate = secureStorage.getSync({key: "gate"});

    if (activateZone === null && safeZone === null && gate === null) {

        updateLogs("Invio richiesta locations...");
        getLocationsPoints();

     }
}

function base64Auth(){

    var stringtext = String(secureStorage.getSync({key: "username"})+":"+secureStorage.getSync({key: "password"}));
    var text = new java.lang.String(stringtext);
    var data = text.getBytes("UTF-8");
    var base64 = android.util.Base64.encodeToString(data,android.util.Base64.DEFAULT);
    android.util.Base64.decode(text, android.util.Base64.DEFAULT);
    return "Basic " + base64;
}
function getLocationsPoints(){

    http.request({
        url: secureStorage.getSync({key: "url"}) + "/locations",
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization" :  base64Auth()},
        }).then((res) => {

            if (res){

                res = JSON.parse(res.content);
                if (res.success){
                    updateLogs("Dati locations ottenuti, li salvo");

                    secureStorage.setSync({key: "activateZone",value: JSON.stringify(res.activateZone)});
                    secureStorage.setSync({key: "safeZone",value: JSON.stringify(res.safeZone)});
                    secureStorage.setSync({key: "gate",value: JSON.stringify(res.gate)});

                }
                else {
                    updateLogs("Errore allo scaricamento delle locations");
                    if (res.error === "Unauthorized"){
                        updateLogs("Accesso alle risorse negato");
                        loginRequired(generalArgs);
                    }
                }

            }

        }).catch((e) => {
            updateLogs("Errore!");
            updateLogs(e);
            loginRequired(generalArgs);
        });
}

function onNavigatingTo(args) {

   generalArgs = args;

   if (checkUserPassUrl()){
       init(args);
   }
   else {
       loginRequired(args);
   }

}

function init(args){

   geolocation.enableLocationRequest();
   page = args.object;
   page.bindingContext = new HomeViewModel();
   const gridcancelloautomatico = page.getViewById("gridcancelloautomatico");
   gridcancelloautomatico.visibility = 'visible';

   manageSwitch();
   manageImage();
   manageLogList();
   manageLocations();
}

function isThePointInArea(m, r) {
    var AB = VectorCalc(r.P1, r.P2);
    var AM = VectorCalc(r.P1, m);
    var BC = VectorCalc(r.P2, r.P3);
    var BM = VectorCalc(r.P2, m);
    var VectorProductABAM = VectorProduct(AB, AM);
    var VectorProductABAB = VectorProduct(AB, AB);
    var VectorProductBCBM = VectorProduct(BC, BM);
    var VectorProductBCBC = VectorProduct(BC, BC);
    return 0 <= VectorProductABAM && VectorProductABAM <= VectorProductABAB && 0 <= VectorProductBCBM && VectorProductBCBM <= VectorProductBCBC;
}

function VectorCalc(p1, p2) {
    return {
            x: (p2.longitude - p1.longitude),
            y: (p2.latitude - p1.latitude)
    };
}

function VectorProduct(u, v) {
    return u.x * v.x + u.y * v.y;
}

function manageMagnetoMeter(){

    updateLogs("Disabilito l'automatico ed attivo il magnetometro per il lock...")
    clearGeolocation();
    page.bindingContext.set('autoOpenGate', false);
    page.bindingContext.set('imageurl',"~/images/casa2d.png");
    page.bindingContext.set('goingToLock', true);

    var mySensorListener = new android.hardware.SensorEventListener({
        onAccuracyChanged: function (sensor, accuracy) { },
        onSensorChanged: function (event) {
            let magnitude = Math.sqrt((event.values[0] * event.values[0]) + (event.values[1] * event.values[1]) + (event.values[2] * event.values[2]));
            updateLogs("magnitude" + magnitude);
            if (magnitude >= 500){
                //lock, 500 okay
                page.bindingContext.set('imageurl',"~/images/casa2dlock.png");
                page.bindingContext.set('goingToLock', false);
            }
            else if (!page.bindingContext.get('goingToLock')) {
                //unlock
                updateLogs("Stato unlock disattivato, attivo i satelliti...")
                updateLogs("Automatico forzato anche se non visualizzato...");
                page.bindingContext.set('autoOpenGateForced',true);
                mSensorManager.unregisterListener(mySensorListener);
                page.bindingContext.set('imageurl',"~/images/casa2d.png");
                //start geolocation blocked and disable it after 5 minutes
                getLocation(true, true);
                setTimeout(function(){
                    updateLogs("Automatico normale, non più forzato");
                    page.bindingContext.set('autoOpenGateForced',false);
                    page.bindingContext.set('autoOpenGate',true);
                },300000);
            }
        }
    });

    var MagneticSensor = mSensorManager.getDefaultSensor(android.hardware.Sensor.TYPE_MAGNETIC_FIELD);

    var didRegListener = mSensorManager.registerListener(
        mySensorListener,
        MagneticSensor,
        android.hardware.SensorManager.SENSOR_DELAY_NORMAL);

}

function manageZone(loc,fast){

    let inTheZone = isThePointInArea(loc,JSON.parse(secureStorage.getSync({key: "activateZone"})));
    let atHome = isThePointInArea(loc,JSON.parse(secureStorage.getSync({key: "safeZone"})));

    if (atHome){
        manageMagnetoMeter();
    }
    else {
        if (inTheZone && !fast) {
            updateLogs("ohohohohoh sei in zona!");
            getLocation(true);

        }
        else if (!inTheZone && fast){
            updateLogs("Sei uscito dalla zona!");
            getLocation(false);
        }
    }

}

function getLocationOptions(fast){
    let options;

    if (fast){
        options = {desiredAccuracy: 3, updateDistance: 1, updateTime : 1000};
    }
    else {
        options = {desiredAccuracy: 3, updateDistance: 1, minimumUpdateTime : 1000 * 20};
    }

    return options;
}

function clearGeolocation(){
    if (typeof watchId !== "undefined"){
        geolocation.clearWatch(watchId);
    }
}

function geolocationIsEnableAndClear(){

    clearGeolocation();

    if (geolocation.isEnabled()){
        return true;
    }

}

function manageDistanceFromTheGate(loc,blocked){

    let distanceFromTheGate = geolocation.distance(loc, JSON.parse(secureStorage.getSync({key: "gate"})));

    updateLogs("Distanza dal cancello:"+distanceFromTheGate)
    if (distanceFromTheGate/loc.speed <= timeToOpenGate){

        if (!page.bindingContext.get('changingGate') &&  page.bindingContext.get('autoOpenGate')
        || !page.bindingContext.get('changingGate') && blocked){

            manageGate();

        }

    }
}
function getLocation(fast,blocked) {

    let options = getLocationOptions(fast);

    if(geolocationIsEnableAndClear()){

        watchId = geolocation.watchLocation(
            function (loc) {

                if (loc) {
                    if (watchId){

                        if (fast){
                            manageDistanceFromTheGate(loc,blocked);
                        }
                        if (!blocked){
                            manageZone(loc,fast);
                        }
                        updateLogs("KM/h "+ loc.speed*3.6);
                    }
                }
            },
            function(e){
                updateLogs("Error: " + e.message);
            },
            options);
    }
    else {
        updateLogs("Abilitare il GPS...")
    }

}

function manageGate(){

    http.request({
        url: secureStorage.getSync({key: "url"}) + "/opengate",
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization" :  base64Auth()},
        }).then((res) => {
        if (res){
             res = JSON.parse(res.content);
             if (res.success){
                 manageStateOfTheGate(Date.now()-res.time);
             }
             else {
                 updateLogs("Errore all'apertura del cancello")
                 if (res.error === "Unauthorized"){
                    updateLogs("Accesso alle risorse negato");
                    loginRequired(generalArgs);
                }
             }

        }

    }).catch((e) => {
        updateLogs("Errore!");
        updateLogs(e);
        loginRequired(generalArgs);
    });


}

function runGateAnimation(time,numberOfFrame,log,action){
    setTimeout(() => {
        page.bindingContext.set('imageurl',"~/images/canzello"+numberOfFrame+".png");
        if (log !== ""){
            updateLogs(log);
        }
        if (action){
            action();
        }

    }, time);
}

function manageStateOfTheGate (syncTime) {
    updateLogs("Tempo di risposta del cancello " + syncTime + " ms");
    updateLogs("Apertura del cancello in corso....");
    page.bindingContext.set('changingGate',true);
    page.bindingContext.set('imageurl',"~/images/canzello0.png");

    // apertura cancello
    let msStartOpening = 6400 - syncTime;
    msStartOpening = (msStartOpening <= 0 ) ? 0 : msStartOpening;

    for (frame of ["1","2","3","4"]){
        runGateAnimation(msStartOpening,frame,(frame === "4")?"Apertura del cancello completata" : "");
        msStartOpening += 3200;
    }

    //chiusura cancello
    let msStartClosing = 57000;
    for (frame of ["3","2","1","0"]){
        let log = "";
        if (msStartClosing === 57000){
            log = "Chiusura del cancello in corso..."
        }
        else if (msStartClosing === 72000) {
            log = "Chiusura del cancello completata"
            runGateAnimation(msStartClosing,frame,log, function(){
                page.bindingContext.set('changingGate',false);
            });
            break;
        }

        runGateAnimation(msStartClosing,frame,log);
        msStartClosing += 5000;
    }

    // apertura completa 15:6
    // comincio la chiusura 56:8
    // chiusura completa 1:11:7

}

function updateLogs(testo){

     if (logs.length > 30){
        logs = new ObservableArray([{ title: "Cancello i log..." }]);
     }

    logs.unshift({ title: testo });
    console.log(testo)
}

function checkUserPassUrl(){
    return secureStorage.getSync({key: "username"}) !== null && secureStorage.getSync({key: "password"}) !== null && secureStorage.getSync({key: "url"}) !== null;
}

function loginRequired(args){

    dialogs.login({
        title: "Dati Account richiesti",
        message: "Inserisci Username e Password",
        okButtonText: "Conferma",
        userName: "",
        password: "",
    }).then(function (r) {

        if (r.result){

            secureStorage.setSync({key: "username",value: r.userName});
            secureStorage.setSync({key: "password",value: r.password});

            dialogs.prompt(
                {
                    title: "Dati richiesti",
                    message: "Indirizzo API richiesto",
                    defaultText: "https://",
                    okButtonText: "Conferma"
                }).then(function (r) {

                if (r.result){
                    secureStorage.setSync({key: "url",value: r.text});
                }
                else {
                    loginRequired(args);
                }

            }).then(function(){

                if(checkUserPassUrl()){
                    init(args);
                }

            })
        }
        else {
            loginRequired(args);
        }


    });



}

exports.onNavigatingTo = onNavigatingTo;








