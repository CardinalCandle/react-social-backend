const {db} = require('../util/admin')

exports.getAllPosts = (req, res) => {
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
}

exports.postOnePost = (req, res) => {
    if(req.method !== 'POST'){
        return res.status(400).json({error: "method not allowed"})
    }
    const newPost = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };

    db
    .collection('posts')
    .add(newPost)
    .then(doc => {
        const resPost = newPost;
        resPost.postId = doc.id;
        res.json({message: `document ${doc.id} created successfully`});
    })
    .catch(err => {
        res.status(500).json({error: `something went wrong`});
        console.error(err)
    })
}

exports.getPost = (req, res) => {
    let postData = {};
    db.doc(`/posts/${req.params.postId}`).get()
    .then((doc) => {
        if(!doc.exists) {
            return res.status(404).json({error: "Post not found"})
        }
        postData = doc.data();
        postData.postId = doc.id;
        return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('postId', '==', req.params.postId)
        .get()
    })
    .then((data) => {
        postData.comments = [];
        data.forEach(doc => {
            postData.comments.push(doc.data());
        });
        return res.json(postData);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
    })
}

exports.commentOnPost = (req, res) => {
    console.log('CONSOLE | ', req.params)
    if(req.body.body.trim() === '') return res.status(400).json({error: 'Must not be empty'});

    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        postId: req.params.postId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    };

    db.doc(`/posts/${req.params.postId}`).get()
    .then((doc) => {
        if(!doc.exists){
            return res.status(404).json({error : 'Post not found'});
        }
        return db.collection('comments').add(newComment);
    })
    .then(() => {
        res.json(newComment);
    })
    .catch((err) => {
        console.log(err);
        res.status(500).json({error : 'Something went wrong'})
    })

}