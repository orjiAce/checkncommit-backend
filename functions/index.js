const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const app = require('express')();
const fbauth = require('./util/fbAuth');
const bizAuth = require('./util/bizAuth');
const adminAuth = require('./util/adminAuth');

const cors = require('cors');
const {recipes} = require("./handlers/reviews");



app.use(cors());


const {db} = require('./util/admin');

const {
    adminLogin, adminData, getAllData,
    getBusinessProfile, getUserProfile,
    singleReview, deleteReview, approveBusiness, claimBusiness, claim, deleteBusiness,deleteReviewer
} = require("./handlers/control");

const {
    getAllReviews,
    searchBusiness,
    postReview,
    sendReview,
    showReview,
    replyToReview,
    reportReview, topReviews, fourStarReviews, overallRating
} = require('./handlers/reviews');

const {
    signUser,
    loginUser,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser,
    markNotificationsRead, createReview,
    getUserDetails, getBusinessDetails,
    getCategory,
    compareVendor,
    getBizCategory, cancelUserMembership,
    getVideos, getBlogPost, postBlog, getSingleBlog,getAllBusiness,followButton,unFollowBtn,registerUser
} = require('./handlers/users');

//for business
const {
    registerBusiness,
    loginBusiness,
    getBusinessData,
    getPieChartData,
    updateBusinessInfo,
    resetPassword,
    deleteImage,
    galleryUpload,
    updateBizLogo,
    cancelSubscription,
    registerWithProof,createSubscription,uploadVideo,subCustomer,checkEmail,checkBusinessName
} = require('./handlers/businesses');

app.get('/allBusiness', getAllBusiness);


//get all reviews
app.get('/reviews', getAllReviews);
//creating reviews
app.post('/review', fbauth, postReview);
//post review with image
app.post('/postReview', fbauth, sendReview);

//app.post('/review/:bizHandle', fbauth, postReview);
//click to view a review
app.get('/review/:reviewId', showReview);
//TODO delete reviews


//report reviews
// app.post('/reviews/:reviewId/report', fbauth, reportReview);

//post reply to reviews
// app.post('/reviews/:reviewId/reply', fbauth, replyToReview  );
//this route will get other user details by using the userHandle
//but this function will be used for business
app.get('/user/:handle', getUserDetails);
//follow button
app.post('/follow', fbauth,followButton);
//unfollow button
app.post('/unfollow',fbauth, unFollowBtn);
//get reviews according to ratings
app.get('/topReviews', topReviews);
app.get('/fourStarReviews', fourStarReviews);

app.get('/businesses/:business', getBusinessDetails);
//this checks if a notifications is read
app.post('/notifications', fbauth, markNotificationsRead);

//search function
app.get('/search/:business', searchBusiness);

//get category
app.get('/allBusiness/:category', getCategory);

//compare businesses
app.post("/compare", compareVendor);

//compare business
app.get("/compareBusiness/:category", getBizCategory);

//SignUp user route
app.post('/signup', registerUser);
//login route
app.post('/login', loginUser);
//route for user to upload image
app.post('/user/image', fbauth, uploadImage);
app.post('/updateUser', fbauth, addUserDetails);
//get authenticated user details
app.get('/user', fbauth, getAuthenticatedUser);

app.post('/uploadVideo', bizAuth,uploadVideo);

//register a business
app.post('/register', registerBusiness);
//login function for business
app.post('/businessLogin', loginBusiness);
//create review
app.post('/createReview', fbauth, createReview);
//app.get('/bizProfile/:handle', getAuthBusinessData);
app.get('/bizProfile', bizAuth, getBusinessData);
//report review
app.post('/report', bizAuth, reportReview);
//reply to review
app.post('/reply', bizAuth, replyToReview);
app.post('/cancelSubscription', bizAuth, cancelSubscription);
//get pieChart data
app.get('/pieChart', bizAuth, getPieChartData);

app.get('/overallRating/:businessName', overallRating);
app.post('/updateBusiness', bizAuth, updateBusinessInfo);
app.post('/resetPassword', resetPassword);
app.post('/updateBizLogo', bizAuth, updateBizLogo);
//upload to gallery
app.post('/galleryUpload', bizAuth, galleryUpload);
app.post('/deleteImage', bizAuth, deleteImage);
app.post('/cancelmembership', fbauth, cancelUserMembership);
app.get('/videos', getVideos);
app.get('/blog', getBlogPost);
app.post('/postBlog', postBlog);
app.get('/getSingleBlog/:postId', getSingleBlog);
app.post('/registerWithProof', registerWithProof);
app.post('/checkEmail/:email', checkEmail);
app.post('/checkBusinessName/:businessName', checkBusinessName);

//test
app.post('/recipes', recipes);
//admin portal
app.post('/adminLogin', adminLogin);
app.get('/admin', adminAuth, adminData);
app.get('/allData', getAllData);
app.get('/getBusinessProfile/:businessId', getBusinessProfile);
app.get('/userProfile/:userId', getUserProfile);
app.get('/singlereview/:reviewId', singleReview);
app.delete('/delete/:reviewId', deleteReview);
app.post('/approveBusiness/:handle', approveBusiness);
app.post('/claimBusiness', claimBusiness);
app.get('/claim/:handle', claim);
app.delete('/deleteBusiness/:businessId', deleteBusiness);
app.delete('/deleteUser/:userId', deleteReviewer);


app.post('/subscribeCustomer', subCustomer);


exports.api = functions.region('europe-west1').https.onRequest(app);

//notification functions

/*

exports.createNotificationOnReport = functions.region('europe-west1')
    .firestore.document('reports/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/reviews/${snapshot.data().reviewId}`)
            .get()
            .then((doc) => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().bizHandle,
                        type: 'report',
                        read: false,
                        reviewId: doc.id
                    });
                }
            })
            .catch((err) => {
                console.error(err);
            });
    });

exports.createNotificationOnReply = functions.region('europe-west1')
    .firestore.document('replies/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/reviews/${snapshot.data().reviewId}`)
            .get()
            .then((doc) => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().bizHandle,
                        type: 'reply',
                        read: false,
                        reviewId: doc.id
                    });
                }
            })
            .catch((err) => {
                console.error(err);

            });
    });

//when a user updates their image we want to make sure their image is updated in all their posts/reviews
exports.onUserImageChange = functions.region('europe-west1').firestore.document('/users/{userId}')
    .onUpdate((change, context) => {
        // console.log(change.before.data());
        // console.log(change.after.data());
        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            console.log("image changed successfully");
            let batch = db.batch();
            return db.collection('reviews').where('userHandle ', '==', change.before.data().handle).get()
                .then((data) => {
                    data.forEach((doc) => {
                        //changes user image in reviews user has made
                        const review = db.doc(`/reviews/${doc.id}`);
                        batch.update(review, {userImage: change.after.data().imageUrl});
                    });
                    return batch.commit();
                })
        } else return true;
    });
*/
