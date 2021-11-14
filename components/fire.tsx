// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBI2Xs1GI3exH7tu9sPqeTUqahihGsr6sw",
  authDomain: "react-88cdb.firebaseapp.com",
  projectId: "react-88cdb",
  storageBucket: "react-88cdb.appspot.com",
  messagingSenderId: "472476463513",
  appId: "1:472476463513:web:6bbd15f0765901365ae308",
  measurementId: "G-T1TCX4WKW2"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
// const analytics = getAnalytics(firebaseApp);

export default firebaseApp