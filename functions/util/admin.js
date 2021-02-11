const serviceAccount = require("../serviceAccountKey.json");
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://react-test-95548.firebaseio.com",
    storageBucket: "react-test-95548.appspot.com"
});

const db = admin.firestore();

//lets import them in other files
module.exports={admin, db};


