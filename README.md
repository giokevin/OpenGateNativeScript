# OpenGateNativeScript

# How to open the gate based upon your GPS coordinates, an Android Nativescript APP.

### What you need:

1) Raspberry PI or similar acting as a server 
2) Relay
3) A remote control for your gate
4) A smartphone with Android

### How it works:

Once filled the information required like the username & passowrd, the Url to the API, the application start to get the position "slowly" for battery saving, when in the activate zone the application need to be precise so the position start to be obtained in a "fast way", when in the safe zone ( this rapresents your garden ) everything is deactivated and the magnetometer is started ( the magnetometer serve as a locker, when the smartphone is nearby it this means that you are inside the home, this is the solution that worked for me, feel free to find anky other kind of indoor localization ) once near the magnet the application goes into the lock mode. To reactivate everything just move out the smartphone from the magnetic field, the application will start to finding the GPS coordinates.

### PHASE 1 - Configuration

- Go into the backend folder, open the fastify.js file and change yourusername and yourpassword with yours then provide the localizations for the activatezone ( the zone outside your garden ) the safezone ( your garden ) the gate ( the gps coordinates for your gate ), openme.py is the script for opening the gate trough the Raspberry PI, i setted the PIN to 18. 

- Put everything on your server, in that case your Raspberry
- npm install
- node fastify.js

### PHASE 2 - Install packages, make your changes

- Be sure to have followed https://docs.nativescript.org/start/quick-setup
- Go to the main folder
- npm install 
- Make your changes
- tns debug android ( for debugging )

### PHASE 3 - Build apk and install it

- tns build android --bundle --env.uglify
- install it on your android phone, work done!


 
