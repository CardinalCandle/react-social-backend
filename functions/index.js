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
const admin = require('firebase-admin')
const { Timestamp } = require('firebase-admin/firestore'); 
const app = require('express')();
const firebase = require('firebase/app')
admin.initializeApp();



const firebaseConfig = {
    apiKey: "AIzaSyDmkLnbxdpuA5AH32qJJV_MpjvxKBIMhQQ",
    authDomain: "react-social-784b8.firebaseapp.com",
    projectId: "react-social-784b8",
    storageBucket: "react-social-784b8.appspot.com",
    messagingSenderId: "1005140683266",
    appId: "1:1005140683266:web:c452c9d6f7a44b81b3951b",
    measurementId: "G-VM9QKFDC31"
  };
  
  
  
firebase.initializeApp(firebaseConfig);
  

app.get('/posts', (req, res) => {
    admin
    .firestore()
    .collection('posts')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
        let posts = [];
        data.forEach(doc => {
            posts.push({
                postId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        });
        return res.json(posts);
    })
    .catch(err => console.error(err));
})


app.post('/post', (req, res) => {
    if(req.method !== 'POST'){
        return res.status(400).json({error: "method not allowed"})
    }
    const newPost = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    admin.firestore()
    .collection('posts')
    .add(newPost)
    .then(doc => {
        res.json({message: `document ${doc.id} created successfully`});
    })
    .catch(err => {
        res.status(500).json({error: `something went wrong`});
        console.error(err)
    })
});

exports.api = functions.region('europe-west1').https.onRequest(app);