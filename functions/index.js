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
const auth = require('firebase/auth');
const { Auth } = require("firebase-admin/auth");
require('firebase/auth');
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
  
  
const firebaseApp = firebase.initializeApp(firebaseConfig);
const firebaseAuth = auth.getAuth(firebaseApp);

const db = admin.firestore();

app.get('/posts', (req, res) => {
    db
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

    db()
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

const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    else return false;
}

// Signup route
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    let errors = {};
    if(isEmpty(newUser.email)) {
        errors.email = 'Must not be empty'
    } else if(!isEmail(newUser.email)){
        errors.email = 'Must be a valid email address'
    }
    if(isEmpty(newUser.password)) errors.password = 'Must not be empty'
    if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match'
    if(isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

    if(Object.keys(errors).length > 0) return res.status(400).json(errors);

    // TODO validate data
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if(doc.exists){
            return res.status(400).json({handle: 'this handle is already taken'});
        } else { 
            return auth
            .createUserWithEmailAndPassword(firebaseAuth, newUser.email, newUser.password)
        }
    })
    .then(data => {
        userId = data.user.uid;
        return auth.getIdToken(data.user);
    })
    .then(idToken => {
        token = idToken;
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
        return res.status(201).json({token});
    })
    .catch(err => {
        console.error(err);
        if (err.code === "auth/email-already-in-use") {
            return res.status(400).json({email: 'Email is already in use'})
        } else {
            return res.status(500).json({error: err.code});
        }
    });
});

app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    let errors = {};

    if(isEmpty(user.email)) errors.email = 'Must not be empty';
    if(isEmpty(user.password)) errors.password = 'Must not be empty';

    if(Object.keys(errors).length > 0) return res.status(400).json(errors);

    auth.signInWithEmailAndPassword(firebaseAuth, user.email, user.password)
    .then(data => {
        return auth.getIdToken(data.user);
    })
    .then(token => {
        return res.json({token});
    })
    .catch((err) => {
        console.error(err);
        if(err.code === "auth/wrong-password") {
            return res.status(403).json({ general: 'Wrong credentials, please try again'})
        } else return res.status(500).json({error: err.code}) 
    });
});

exports.api = functions.region('europe-west1').https.onRequest(app);