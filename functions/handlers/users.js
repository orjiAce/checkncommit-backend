const {db, admin} = require('../util/admin');
const config = require('../util/config');
const firebase = require('firebase');


firebase.initializeApp(config);

const {validateSignUpData, validateLoginData, reduceUserDetails} = require('../util/validate');


//signUp user
/*exports.signUser = (req, res) => {
    const newUser = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        location: req.body.location,
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    //destructuring: extract 'valid' & 'errors'
    const {valid, errors} = validateSignUpData(newUser);
    if (!valid) return res.status(400).json(errors);


    const noImag = 'no-image.png';

    //validate data
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({userHandle: 'this handle is already taken'});
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();

        }).then(idToken => {
        token = idToken;
        //Creates user document here
        const userCredentials = {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            location: newUser.location,
            phone: newUser.phone,
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImag}?alt=media`,
            userId
        };
        //adds user credentials to database
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
        .then(() => {
            return res.status(201).json({token});
        })

        .catch(err => {
            //properly checks if another user is already registered with this email
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({general: 'Email is already in use'})
            } else if (err.code === 'auth/weak-password') {
                return res.status(500).json({general: 'Weak Password, Password should be at least 6 characters '});
            }
            {
                return res.status(500).json({general: 'Something went wrong please try again '});
            }

        });
};*/


exports.registerUser = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({headers: req.headers});
    const newUser = {
        firstName: req.body,
        lastName: req.body,
        location: req.body,
      //  areaCode: req.body,
        phone: req.body,
        email: req.body,
        password: req.body,
        confirmPassword: req.body,
        handle: req.body
    };

    //destructuring: extract 'valid' & 'errors'
   // const {valid, errors} = validateSignUpData(newUser);
    //if (!valid) return res.status(400).json(errors);

    let imageToBeUploaded = {};
    let imageFileName;
    const fields = newUser;

    busboy.on('field', (key, value) => {
        // You could do additional deserialization logic here, values will just be
        // strings
        fields[key] = value;
    });


    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname, file, filename, encoding, mimetype);
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({error: 'Wrong file type submitted'});
        }
        // my.image.png => ['my', 'image', 'png']
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        // 32756238461724837.png
        imageFileName = `${Math.round(
            Math.random() * 1000000000000
        ).toString()}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', () => {
        //validate data
        let token, userId;
        db.doc(`/users/${newUser.handle}`).get()
            .then(doc => {
                if (doc.exists) {
                    return res.status(400).json({username: 'this username is already taken'});
                } else {
                    return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
                }
            })
            .then(data => {
                userId = data.user.uid;
                return data.user.getIdToken();

            }).then(idToken => {
            token = idToken;
            //Creates user document here
            admin
                .storage()
                .bucket()
                .upload(imageToBeUploaded.filepath, {
                    resumable: false,
                    metadata: {
                        metadata: {
                            contentType: imageToBeUploaded.mimetype
                        }
                    }
                })
                .then(() => {

                    const userCredentials = {
                        firstName: newUser.firstName,
                        lastName: newUser.lastName,
                        location: newUser.location,
                        phone: newUser.phone,
                        handle: newUser.handle,
                        email: newUser.email,
                        createdAt: new Date().toISOString(),
                        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${
                            config.storageBucket
                        }/o/${imageFileName}?alt=media`,
                        userId
                    };
                    //adds user credentials to database
                    return db.doc(`/users/${newUser.handle}`).set(userCredentials);
                });
        }).then(() => {
            return res.status(201).json({token});
        })


            .catch(err => {
                //properly checks if another user is already registered with this email
                console.error(err);
                if (err.code === 'auth/email-already-in-use') {
                    return res.status(400).json({general: 'Email is already in use'})
                } else if (err.code === 'auth/weak-password') {
                    return res.status(500).json({general: 'Weak Password, Password should be at least 6 characters '});
                }
                {
                    return res.status(500).json({general: 'Something went wrong please try again '});
                }

            });

    });

        busboy.end(req.rawBody);
};

//logs in user
exports.loginUser = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    const {valid, errors} = validateLoginData(user);
    if (!valid) return res.status(400).json(errors);
    db.collection("users")
        .where("email", "==", user.email).get()
        .then(result => {
            if (!result.empty) {
                firebase
                    .auth()
                    .signInWithEmailAndPassword(user.email, user.password)
                    .then((data) => {

                        return data.user.getIdToken()
                    })
                    .then((token) => {
                        return res.json({token});
                    })
                    .catch((err) => {
                        console.error(err);
                        if (err.code === 'auth/user-not-found') {
                            return res.status(403).json({general: 'No registered user with this email'});
                        }
                        if (err.code === 'auth/network-request-failed') {
                            return res.status(403).json({general: 'Network error, please try again'});
                        }
                        if (err.code === 'auth/wrong-password') {
                            return res.status(403).json({general: 'Password is incorrect'});
                        } else {
                            return res.status(500).json({general: 'Something went wrong please try again'});
                        }

                    });
            } else {
                return res.status(403).json({general: 'No registered user with this email'});
            }
        }).catch((err) => {
        res.status(500).json({error: 'Something went wrong'});
        console.error(err);
    })
};


//create business review

exports.createReview = (req, res) => {


    const noImag = 'no-image.png';

    const inputFields = {
        title: req.body,
        body: req.body,
        ratings: req.body,
        businessName: req.body,
        customerService: req.body,
        phone: req.body,
        email: req.body,
        SMHandle: req.body,
        category: req.body,
        AddressOne: req.body,
        createdAt: new Date().toISOString()
    };


    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    const busboy = new BusBoy({
        headers: req.headers,
        limits: {
            // Cloud functions impose this restriction anyway
            fileSize: 10 * 1024 * 1024,
        }
    });

    let images = {};
    let imageFileName = {};
    let imagesToUpload = [];
    let imageToAdd = [];
    let allImages = [];

    const fields = inputFields;

    // Note: os.tmpdir() points to an in-memory file system on GCF
    // Thus, any files in it must fit in the instance's memory.
    const tmpdir = os.tmpdir();

    busboy.on('field', (key, value) => {
        // You could do additional deserialization logic here, values will just be
        // strings
        fields[key] = value;
    });


    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname, file, filename, encoding, mimetype);
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png' && mimetype !== 'image/jpg' && mimetype !== 'image/jpg') {
            return res.status(400).json({error: 'Wrong file type submitted'});
        }
        // my.image.png => ['my', 'image', 'png']
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        // 32756238461724837.png
        imageFileName = `${Math.round(
            Math.random() * 1000000000000
        ).toString()}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToAdd = {imageFileName, filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));
        images = imagesToUpload.push(imageToAdd);

    });

    busboy.on('finish', () => {

        db.doc(`/businesses/${inputFields.businessName}`).get()
            .then(doc => {

                if (doc.exists) {
                    return res.status(400).json({userHandle: 'this handle is already taken'});
                } else {

                imagesToUpload.forEach(myImages => {
                    allImages.push(myImages);

                    admin
                        .storage()
                        .bucket()
                        .upload(myImages.filepath, {
                            resumable: false,
                            metadata: {
                                metadata: {
                                    contentType: myImages.mimetype
                                }
                            }
                        });
                });

                //return res.json(newReview)

                let imageUrls = [];
                imagesToUpload.forEach(image => {
                    imageUrls.push(
                        `https://firebasestorage.googleapis.com/v0/b/${
                            config.storageBucket
                        }/o/${image.imageFileName}?alt=media`,
                    )

                });
                const newReview = {
                    body: inputFields.body,
                    userHandle: req.user.handle,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    title: inputFields.title,
                    rating: inputFields.ratings + 'star',
                    userImage: req.user.imageUrl,
                    images: imageUrls,
                    replies: 0,
                    reportCount: 0,
                    business: inputFields.businessName.toLowerCase(),
                    handle: inputFields.businessName.toLowerCase(),
                    customerService: inputFields.customerService + 'star',
                    createdAt: new Date().toISOString()
                };

                const tempBusiness = {
                    claimed: false,
                    subscription: false,
                    businessName: inputFields.businessName,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    handle: inputFields.businessName,
                    AddressOne: inputFields.AddressOne,
                    email: inputFields.email,
                    SMHandle: inputFields.SMHandle,
                    category: inputFields.category,
                    phone: inputFields.phone,
                    AddressTwo: '',
                    state: '',
                    country: '',
                    bio: '',
                    businessId: '',

                    logoUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImag}?alt=media`,
                    /* image1: req.body.image1,*/
                    createdAt: new Date().toISOString()
                };

                db.collection('reviews')
                    .add(newReview).then((doc) => {


                    return db.doc(`/businesses/${inputFields.businessName}`).set(tempBusiness);

                }).then(() => {
                    return res.status(201).json({message: 'review submitted successfully'});
                })
                    .catch((err) => {
                     if (err.code === 'auth/id-token-expired') {
                            return res.status(500).json({general: 'Checkncommit session token has expired, please refresh and login'});
                        }
                     {
                            res.status(500).json({error: 'Something went wrong'});
                            console.error(err);
                        }
                    });
            }
            });

    });
        busboy.end(req.rawBody);


};

//update user details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);
    db.doc(`/users/${req.user.handle}`).update(userDetails)
        .then(() => {
            return res.json({message: "Details updated successfully"})
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        })
};

//get any user details
// this function will be for business page, it will be used to get reviews made for businesses
exports.getUserDetails = (req, res) => {
    let userInfo = {};
    db.doc(`/users/${req.params.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                userInfo.user = doc.data();
                return db.collection('reviews').where('userHandle', '==', req.params.handle)
                    .orderBy('createdAt', 'desc')
                    .get();
            } else {
                return res.status(404).json({error: 'User not found'})
            }
        })
        .then(data => {
            userInfo.reviews = [];
            data.forEach(doc => {
                userInfo.reviews.push({
                    body: doc.data().body,
                    business: doc.data().business,
                    createdAt: doc.data().createdAt,
                    handle: doc.data().userHandle,
                    userImage: doc.data().userImage,
                    replies: doc.data().replies,
                    image1: doc.data().image1,
                    reportsCount: doc.data().reportsCount,
                    rating: doc.data().rating,
                    images: doc.data().images,
                    dataSize: data.size,
                    reviewId: doc.id
                })
            });
            return res.json(userInfo);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        })
};


//get businesses according category. for compare vendors

exports.getBizCategory = (req, res) => {

    let bizInfo = [];
    db.collection("businesses").where("category", '==', req.params.category).get()
        .then(doc => {
            if (doc.empty) {
                return res.status(500).json({error: " Document does not exist"});

            } else {
                bizInfo.businesses = [];

                doc.forEach(result => {
                    bizInfo.push({
                        category: result.data().category,
                        logoUrl: result.data().logoUrl,
                        country: result.data().country,
                        businessName: result.data().businessName,
                        handle: result.data().handle,
                        bio: result.data().bio,
                        AddressOne: result.data().AddressOne,
                        bizId: result.data().businessId,
                    });
                });
                return res.status(200).json(bizInfo);
            }
        }).catch(err => {
        return res.status(500).json({error: err.code});
    })
};

exports.compareVendor = (req, res) => {
    let bizHandle = {};

    let bizInfo = {};
    let reviews = [];


    console.log(req.body);
    db.collection("businesses")
        .where("handle", "in", req.body).limit(3).get()
        .then(doc => {
            if (doc.empty) {
                return res.status(401).json({error: 'No business found'});
            } else {
                bizInfo.businessToCompare = [];
                doc.forEach(result => {
                    // allBusiness =result.data();
                    bizInfo.businessToCompare.push({
                        category: result.data().category,
                        logoUrl: result.data().logoUrl,
                        country: result.data().country,
                        businessName: result.data().businessName,
                        handle: result.data().handle,
                        bizId: result.id,
                        //reviews: reviews,

                    });
                });

            }
            return db.collection("reviews")
                .where("business", "in", req.body).orderBy('createdAt', 'desc').limit(3)
                .get()
        }).then((data) => {
        bizInfo.reviews = [];

        data.forEach(doc => {
            //console.log(doc.id, '=>', doc.data());
            bizInfo.reviews.push({
                body: doc.data().body,
                title: doc.data().title,
                business: doc.data().business,
                createdAt: doc.data().createdAt,
                userHandle: doc.data().userHandle,
                userImage: doc.data().userImage,
                replies: doc.data().replies,
                reportsCount: doc.data().reportsCount,
                rating: doc.data().rating,
                images: doc.data().images,
                docSize: data.size,
                handle: doc.data().userHandle,
                reviewId: doc.id
            });
            // return res.json(doc.data());
        });

        return res.status(200).json(bizInfo)
    }).catch(err => {
        return res.status(500).json({error: err.message});
    });


};


//get business details
exports.getBusinessDetails = (req, res) => {
    let bizInfo = {};
    let citiesRef = db.collection('businesses');
    let query = citiesRef.where('handle', '==', req.params.business).get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No matching documents.');
                return;
            }
            bizInfo.business = [];
            snapshot.forEach(doc => {
                bizInfo.business = doc.data();
            });
            return db.collection('reviews').where('business', '==', req.params.business)
                .orderBy('createdAt', 'desc')
                .get();


        }).then(data => {

            bizInfo.reviews = [];

            data.forEach(doc => {
                //console.log(doc.id, '=>', doc.data());
                bizInfo.reviews.push({
                    body: doc.data().body,
                    title: doc.data().title,
                    handle: doc.data().userHandle,
                    business: doc.data().business,
                    createdAt: doc.data().createdAt,
                    userHandle: doc.data().userHandle,
                    firstName: doc.data().firstName,
                    lastName: doc.data().lastName,
                    userImage: doc.data().userImage,
                    replies: doc.data().replies,
                    reportsCount: doc.data().reportsCount,
                    rating: doc.data().rating,
                    images: doc.data().images,
                    docSize: data.size,
                    reviewId: doc.id
                });
                // return res.json(doc.data());

            });
            return db.collection("gallery")
                .where("bizHandle", "==", req.params.business).get()

        })
        .then((result) => {
            bizInfo.gallery = [];
            result.forEach((doc) => {
                bizInfo.gallery.push({
                    bizHandle: doc.data().bizHandle,
                    imageUrl: doc.data().imageUrl,
                    imageId: doc.id,
                    imageName: doc.data().imageName,
                    createdAt: doc.data().createdAt,
                });
            });
            return db.collection("reviewsChart").doc(req.params.business).collection("pieData").get();
        }).then((querySnapshot) => {
            bizInfo.overallRate = [];


                querySnapshot.forEach((doc) => {

                        bizInfo.overallRate.push({

                                id: doc.data().id,
                                label: doc.data().label,
                                value: doc.data().value,
                                color: doc.data().color,

                        })
            });
            return  db.collection('following').where('business', '==', req.params.business).get()
        }).then((data) =>{
            bizInfo.followers = [];
            data.forEach((doc) =>{
                bizInfo.followers.push({
                    business: doc.data().business,
                    userHandle: doc.data().user,
                    createdAt: doc.data().createdAt,
                })
            });
            return res.json(bizInfo);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        });

};


//get categories
exports.getCategory = (req, res) => {
    let searchQ = db.collection('businesses').where('category', '==', req.params.category).get()
        .then(doc => {
            if (doc.empty) {
                return res.status(401).json({error: 'No business found'});
            } else {
                let allBusiness = [];
                doc.forEach(result => {
                    // allBusiness =result.data();
                    allBusiness.push({
                        category: result.data().category,
                        logoUrl: result.data().logoUrl,
                        country: result.data().country,
                        businessName: result.data().businessName,
                        handle: result.data().handle,
                        bio: result.data().bio,
                        bizId: result.id,
                    });

                });
                return res.json(allBusiness);
            }
        }).catch(err => {
            return res.status(500).json({error: err.code});
        });
};


//get logged in user detail
exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
    //get user
    db.doc(`/users/${req.user.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db.collection('reports').where('userHandle', '==', req.user.handle).get();
            }
        }).then(data => {
        userData.reports = [];
        data.forEach((doc) => {
            userData.reports.push(doc.data());
        });
        //get auth. user notifications
        return db.collection("notifications").where("recipient", "==", req.user.handle)
            .orderBy('createdAt', 'desc').limit(10).get()

    })
        .then((data) => {
            userData.notifications = [];
            data.forEach((doc) => {
                userData.notifications.push({
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    createdAt: doc.data().createdAt,
                    reviewId: doc.data().reviewId,
                    type: doc.data().type,
                    read: doc.data().read,
                    notificationId: doc.id
                });
            });
            return db.collection('reviews').where('userHandle', '==', req.user.handle).get();

            // return user reviews also
        }).then(data => {
        userData.reviews = [];
        data.forEach((doc) => {
            userData.reviews.push({
                business: doc.data().business,
                body: doc.data().body,
                createdAt: doc.data().createdAt,
                handle: doc.data().userHandle,
                userImage: doc.data().userImage,
                replies: doc.data().replies,
                reportsCount: doc.data().reportsCount,
                rating: doc.data().rating,
                customerService: doc.data().customerService,
                dataSize: data.size,
                title: doc.data().title,
                firstName: doc.data().firstName,
                lastName: doc.data().lastName,
                images: doc.data().images,
                reviewId: doc.id
            })
            //userData.reviews.push(doc.data());
        });
        return res.json(userData);
    })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        })
};


// Upload a profile image for user
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({headers: req.headers});

    let imageToBeUploaded = {};
    let imageFileName;

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname, file, filename, encoding, mimetype);
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({error: 'Wrong file type submitted'});
        }
        // my.image.png => ['my', 'image', 'png']
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        // 32756238461724837.png
        imageFileName = `${Math.round(
            Math.random() * 1000000000000
        ).toString()}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
        admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filepath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype
                    }
                }
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
                    config.storageBucket
                }/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${req.user.handle}`).update({imageUrl});
            })
            .then(() => {
                const userImage = `https://firebasestorage.googleapis.com/v0/b/${
                    config.storageBucket
                }/o/${imageFileName}?alt=media`;
                return db.collection('reviews').where('userHandle ', '==', req.user.handle).get()
                    .then((data) => {
                        data.forEach((doc) => {
                            //changes user image in reviews user has made
                            const review = db.doc(`/reviews/${doc.id}`);
                            return review.update({userImage});
                        });

                    })


            }).then(() => {
            return res.json({message: 'image uploaded successfully'});
        })
            .catch((err) => {
                console.error(err);
                return res.status(500).json({error: 'something went wrong'});
            });
    });
    busboy.end(req.rawBody);
};


//get all businesses
exports.getAllBusiness = (req, res) => { //a get request to get all the reviews
    db.collection("businesses")
        .orderBy('createdAt', 'desc')//order the review query in descending order
        .get()
        .then(data => {
            let totalBusiness = [];
            data.forEach((doc) => {
                totalBusiness.push({ //get the reviews by passing them as an object
                    businessName: doc.data().businessName,
                    proof: doc.data().proof,
                    AddressTwo: doc.data().AddressTwo,
                    AddressOne: doc.data().AddressOne,
                    businessId: doc.data().businessId,
                    category: doc.data().category,
                    country: doc.data().country,
                    createdAt: doc.data().createdAt,
                    firstName: doc.data().firstName,
                    email: doc.data().email,
                    lastName: doc.data().lastName,
                    logoUrl: doc.data().logoUrl,
                    claimed: doc.data().claimed,
                    SMHandle: doc.data().SMHandle,
                    subscription: doc.data().subscription,
                    phone: doc.data().phone,
                    approved: doc.data().approved,
                    website: doc.data().website,
                });
            });
            return res.json(totalBusiness);
        })
        .catch((err) => {
            return res.status(500).json({error: err.code});
        })
};


exports.cancelUserMembership = (req, res) => {
    // const document = db.doc(`/reviews/${req.params.userHandle}`);
    // const document = db.doc(`/users/${req.body.handle}`).delete()

    const userDoc = db.doc(`/users/${req.user.handle}`).get().then((result) => {
        if (result.empty) {


            return res.status(404).json({message: 'User not found'});

        } else {
            user = result.data();
            admin.auth().deleteUser(req.user.userId)
                .then(function () {
                    // console.log('Successfully deleted user');
                    db.doc(`/users/${req.user.handle}`).delete()
                        .then(() => {

                            const document = db.collection('reviews').where('userHandle', '==', req.user.handle);
                            document.get().then(function (querySnapshot) {
                                querySnapshot.forEach(function (doc) {
                                    doc.ref.delete().then(r => {
                                        return res.status(201).json({message: 'deleted'});
                                    });
                                });
                            })
                        })
                })

        }
    }).catch((err) => {
        return res.status(500).json({error: "Couldn't delete".err.code});
    })

};


exports.getVideos = (req, res) => {
    db.collection("videos")
        .orderBy('createdAt', 'desc')//order the review query in descending order
        .get()
        .then(doc => {
            let videos = [];
            doc.forEach((result) => {
                videos.push({
                    urlLink: result.data().urlLink
                })
            });
            return res.status(201).json(videos);
        }).catch((err) => {
        return res.status(500).json({error: err.message})
    })
};

exports.getBlogPost = (req, res) => {
    let allBlogPost = [];
    db.collection('blog').orderBy('createdAt', 'desc')
        .get()
        .then(doc => {
                if (!doc.empty) {

                    doc.forEach((result) => {
                        allBlogPost.push({
                            title: result.data().title,
                            content: result.data().content,
                            createdAt: result.data().createdAt,
                            headerImage: result.data().headerImage,
                            category: result.data().category,
                            postId: result.id
                        })
                    });
                } else {
                    return res.status(201).json({error: "No blog posts yet"});
                }
                return res.status(201).json(allBlogPost);
            }
        ).catch((err) => {
        return res.status(500).json(err.message);
    })

};

exports.postBlog = (req, res) => {

    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    const busboy = new BusBoy({
        headers: req.headers,
        limits: {
            // Cloud functions impose this restriction anyway
            fileSize: 10 * 1024 * 1024,
        }
    });

    let imageToBeUploaded = {};
    let imageFileName;

    const inputFields = {
        title: req.body,
        content: req.body,
        category: req.body,
        createdAt: new Date().toISOString()
    };

    const fields = inputFields;


    // Note: os.tmpdir() points to an in-memory file system on GCF
    // Thus, any files in it must fit in the instance's memory.
    const tmpdir = os.tmpdir();

    busboy.on('field', (key, value) => {
        // You could do additional deserialization logic here, values will just be
        // strings
        fields[key] = value;
    });


    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname, file, filename, encoding, mimetype);
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({error: 'Wrong file type submitted'});
        }
        // my.image.png => ['my', 'image', 'png']
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        // 32756238461724837.png
        imageFileName = `${Math.round(
            Math.random() * 1000000000000
        ).toString()}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
        admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filepath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype
                    }
                }
            })
            .then(() => {
                const headerImage = `https://firebasestorage.googleapis.com/v0/b/${
                    config.storageBucket
                }/o/${imageFileName}?alt=media`;

                const blogPost = {
                    content: inputFields.content,
                    title: inputFields.title,
                    category: inputFields.category,
                    headerImage: headerImage,
                    createdAt: new Date().toISOString()
                };
                return db.collection('blog')
                    .add(blogPost);
            })
            .then(() => {
                return res.json({message: 'Blog posted successfully'});
            })
            .catch((err) => {
                console.error(err);
                return res.status(500).json({error: 'something went wrong'});
            });
    });
    busboy.end(req.rawBody);

};


//get single blog post
exports.getSingleBlog = (req, res) => {
    const postId = req.params.postId;
    db.doc(`/blog/${postId}`).get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(404).json({error: "Blog post not found"})
            } else {
                let post = {};
                post.blogPost = doc.data();
                return res.status(201).json(post)
            }

        }).catch((err) => {
        return res.status(500).json({error: "Something went wrong"})
    });
};



exports.followButton = (req, res) => {
    const info = {
        business: req.param.business,
        //user: req.user.handle,
        user: req.user.handle,
        createdAt: new Date().toISOString()
    };
    const following = db.collection('following').where('user', '==', req.user.handle)
        .where('business', '==', req.body.business);
    let followData = {};
    const business = db.doc(`/businesses/${req.body.business}`);
    following.get()
        .then(doc => {
            //check if review exist
            if (doc.empty) {
                return business.get()


                    .then(() => {
                        return db.collection('following').add({
                            business: req.body.business,
                            //user: req.user.handle,
                            user: req.user.handle,
                            createdAt: new Date().toISOString()


                        }).then(() => {
                            business.followers++;
                            console.log(business.followers);
                            return business.update({followers: business.followers})
                        })

                    })
                    //here everything is successful
                    .then(() => {
                        //return res.json(reviewData);
                        return res.status(201).json({message: "Successful"})
                    });
            } else {
                return res.json({message: "Already following"})
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: err.code});
        })
};

exports.unFollowBtn = (req, res) => {
    const business = db.doc(`/businesses/${req.body.business}`);
    const document = db.collection('following').where('user', '==', req.user.handle)
        .where('business', '==', req.body.business);
    let followData = {};
    document.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            doc.ref.delete().then(r => {
                return business.get()
                    .then(() => {
                        business.followers--;
                        console.log(business.followers);
                        return business.update({followers:business.followers})
                            .then(() => {
                                return res.status(201).json({message: 'Unfollowed'});
                            })

                    })


            })
        })
    }).catch((err) => {
        return res.status(500).json({error: "Error occurred"})
    });
};


//mark opened or read notification as read or seen
exports.markNotificationsRead = (req, res) => {
// now we gonna do a batch h write, this is done when u need to update multiple documents
    let batch = db.batch();
    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, {read: true});
    });
    batch.commit()
        .then(() => {
            return res.json({message: 'Notifications marked read'});
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        });
};




