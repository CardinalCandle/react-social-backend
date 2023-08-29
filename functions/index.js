/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions')
const { Timestamp } = require('firebase-admin/firestore'); 
const app = require('express')();
const firebase = require('firebase/app')
const auth = require('firebase/auth');
const { Auth } = require("firebase-admin/auth");
require('firebase/auth');

const { getAllPosts, postOnePost } = require('./handlers/posts');
const { signup, login, uploadImage, addUserDetails, getAutheticatedUser } = require('./handlers/users');
const FBAuth = require('./util/fbAuth')
const firebaseConfig = require('./util/config')
  
  
const firebaseApp = firebase.initializeApp(firebaseConfig);
const firebaseAuth = auth.getAuth(firebaseApp);

// Post routes
app.get('/posts', getAllPosts)
app.post('/post', FBAuth, postOnePost);
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAutheticatedUser)
// users route
app.post('/signup', signup);
app.post('/login', login);

exports.api = functions.region('europe-west1').https.onRequest(app);