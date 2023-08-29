const {db, admin} = require('../util/admin');
const firebase = require('firebase/app');
const config = require('../util/config')
const auth = require('firebase/auth');

const firebaseApp = firebase.initializeApp(config)
const firebaseAuth = auth.getAuth(firebaseApp);

const {validateSignupData, validateLoginData} = require('../util/validators');
const busboy = require('busboy');

exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };
    const { valid, errors } = validateSignupData(newUser);

    if(!valid) return res.status(400).json(errors);

    const noImg = 'no-img.png'
        
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
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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
        } else if (err.code === "auth/weak-password") {
            return res.status(400).json({password: 'Weak password'})
        } else {
            return res.status(500).json({error: err.code});
        }
    });
}

exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    const { valid, errors } = validateLoginData(user);

    if(!valid) return res.status(400).json(errors);

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
}

exports.uploadImage = (req, res) => {
    const busboy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const bb = busboy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    bb.on('file', (name, file, info) => {
        const { filename, encoding, mimeType } = info;
        const fileName = info.filename
        const mimetype = info.mimeType

        if(mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({error: "Wrong file type submitted" });
        }
        const imageExtension = fileName.split('.')[fileName.split('.').length - 1];
        imageFileName = `${Math.round(Math.random()*1000000000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);

        imageToBeUploaded = {filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));
    });
    bb.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
            console.log('imageurl ====>', imageUrl);
            return db.doc(`/users/${req.user.handle}`).update({imageUrl});
        })
        .then(() => {
            return res.json({message: 'Image uploaded successfully'});
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code});
        });
    });
    bb.end(req.rawBody);
}