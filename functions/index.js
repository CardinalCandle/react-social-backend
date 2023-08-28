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
admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started


exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Ohio from Firebase!");
});

exports.getPosts = functions.https.onRequest((req, res) => {
    admin.firestore().collection('posts').get()
    .then(data => {
        let posts = [];
        data.forEach(doc => {
            posts.push(doc.data());
        });
        return res.json(posts);
    })
    .catch(err => console.error(err));
});

exports.createPost = functions.https.onRequest((req, res) => {
    const newPost = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: Timestamp.fromDate(new Date())
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