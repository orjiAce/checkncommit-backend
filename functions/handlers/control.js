const {db, admin} = require('../util/admin');
const config = require('../util/config');
const firebase = require('firebase');



exports.adminLogin = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };


    db.collection("admin")
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
                return res.status(403).json({general: 'Admin not found'});
            }
        }).catch((err) => {
        res.status(500).json({error: 'Something went wrong'});
        console.error(err);
    })

};


exports.adminData = (req, res) => {
    let adminInfo = {};
    db.doc(`/admin/${req.user.email}`).get()
        .then(doc => {
            if (doc.exists) {
                adminInfo.admin = doc.data();
                return res.status(201).json(adminInfo);
            } else {
                return res.status(404).json({error: 'User not found'})
            }
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        })
};

exports.getAllData = (req, res) => {
    let allData = {};
    db.collection("reviews")
        .orderBy('createdAt', 'desc')//order the review query in descending order
        .get()
        .then(data => {
            allData.reviews = [];
            data.forEach((doc) => {
                allData.reviews.push({ //get the reviews by passing them as an object
                    reviewId: doc.id,
                    body: doc.data().body,
                    title: doc.data().title,
                    firstName: doc.data().firstName,
                    rating: doc.data().rating,
                    business: doc.data().business,
                    customerService: doc.data().customerService,
                    lastName: doc.data().lastName,
                    reportCount: doc.data().reportCount,
                    replies: doc.data().replies,
                    images: doc.data().images,
                    createdAt: doc.data().createdAt,
                    docSize: data.size,
                    userImage: doc.data().userImage,
                    reviewId: doc.id
                });
            });

            return db.collection('businesses').where('approved', '==', true).orderBy('createdAt', 'desc')
                .get()
        })
        .then((data) => {
            allData.businesses = [];
            data.forEach((doc) => {
                allData.businesses.push({

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
                    subscription: doc.data().subscription,
                    phone: doc.data().phone,
                    approved: doc.data().approved,
                    website: doc.data().website,
                })
            });
            return db.collection('businesses').where('approved', '==', false)
                .orderBy('createdAt', 'desc')
                .get()
        }).then((result) => {

        allData.unApproved = [];
        result.forEach((doc) => {
            allData.unApproved.push({
                businessName: doc.data().businessName,
                proof: doc.data().proof,
                AddressTwo: doc.data().AddressTwo,
                AddressOne: doc.data().AddressOne,
                businessId: doc.data().businessId,
                category: doc.data().category,
                email: doc.data().email,
                country: doc.data().country,
                createdAt: doc.data().createdAt,
                firstName: doc.data().firstName,
                lastName: doc.data().lastName,
                logoUrl: doc.data().logoUrl,
                subscription: doc.data().subscription,
                phone: doc.data().phone,
                approved: doc.data().approved,
                claimed: doc.data().claimed,
                website: doc.data().website,
            })
        });
        return db.collection('users').orderBy('createdAt', 'desc')
            .get();

    }).then((result) => {

        allData.users = [];
        result.forEach((users) => {
            allData.users.push({
                firstName: users.data().firstName,
                lastName: users.data().lastName,
                email: users.data().email,
                handle: users.data().handle,
                imageUrl: users.data().imageUrl,
                phone: users.data().phone,
                userId: users.data().userId,
                location: users.data().location,
                createdAt: users.data().createdAt
            })
        });


        return db.collection('businesses').where('claimed', '==', false)
            .orderBy('createdAt', 'desc')
            .get()

    }).then((result)=>{
        allData.unClaimed = [];
        result.forEach((doc) => {
            allData.unClaimed.push({
                businessName: doc.data().businessName,
                AddressTwo: doc.data().AddressTwo,
                AddressOne: doc.data().AddressOne,
                category: doc.data().category,
                email: doc.data().email,
                country: doc.data().country,
                createdAt: doc.data().createdAt,
                firstName: doc.data().firstName,
                lastName: doc.data().lastName,
                logoUrl: doc.data().logoUrl,
                subscription: doc.data().subscription,
                handle: doc.data().handle,
                approved: doc.data().approved,
                claimed: doc.data().claimed,
                website: doc.data().website,
            })
        });

        return res.json(allData);
    })





        .catch((err) => console.error(err))
};


exports.getBusinessProfile = (req, res) => {
    let business = '';
    let bizInfo = {};
    let citiesRef = db.collection('businesses');
    let query = citiesRef.where('businessId', '==', req.params.businessId).get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No matching documents.');
                return;
            }
            bizInfo.business = {};
            snapshot.forEach(doc => {

                bizInfo.business = doc.data();
                business = doc.data().handle
            });
            return db.collection('reviews').where('business', '==', business)
                .orderBy('createdAt', 'desc')
                .get();
        }).then((data) => {

            bizInfo.reviews = [];

            data.forEach(doc => {
                //console.log(doc.id, '=>', doc.data());
                bizInfo.reviews.push({
                    body: doc.data().body,
                    proof: doc.data().proof,
                    title: doc.data().title,
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
                .where("bizHandle", "==", business).get()

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
            return res.json(bizInfo);

        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        });

};


exports.getUserProfile = (req, res) => {
    let handle = '';
    let userInfo = {};
    let citiesRef = db.collection('users');
    let query = citiesRef.where('userId', '==', req.params.userId).get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No matching documents.');
                return;
            }
            userInfo.user = {};
            snapshot.forEach(doc => {

                userInfo.user = doc.data();
                handle = doc.data().handle
            });
            return db.collection('reviews').where('userHandle', '==', handle)
                .orderBy('createdAt', 'desc')
                .get();
        }).then((data) => {

            userInfo.reviews = [];

            data.forEach(doc => {
                //console.log(doc.id, '=>', doc.data());
                userInfo.reviews.push({
                    body: doc.data().body,
                    title: doc.data().title,
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


            return res.json(userInfo);

        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        });

};

exports.singleReview = (req, res) => {
    let reviewData = {};
    db.doc(`/reviews/${req.params.reviewId}`).get()
        .then(doc => {
            //checks if this document exists or not
            if (!doc.exists) {
                return res.status(404).json({error: 'Review not found'})
            }
            reviewData.review = doc.data();
            //  return res.json(reviewData);
            return db
                .collection('replies')
                .orderBy('createdAt', 'desc')
                .where(`reviewId`, `==`, req.params.reviewId).get()
        }).then(data => {
        //query snapshot because it may returns multiple documents
        reviewData.replies = [];
        data.forEach(doc => {
            reviewData.replies.push(doc.data())
        });
        return db
            .collection('reports')
            .where(`reviewId`, `==`, req.params.reviewId).get()
    }).then(data=>{
        reviewData.reports = [];
        data.forEach(doc => {
            reviewData.reports.push(doc.data())
        });
        return res.json(reviewData);
    })
        .catch(err => {
        console.error(err);
        res.status(500).json({error: err.code});
    });


};





//claim business
exports.claimBusiness = (req, res) =>{

    if (req.body.firstName.trim() === '') {
        return res.status(400).json({body: 'First name must not be empty'});
    } else if (req.body.lastName.trim() === '') {
        return res.status(400).json({body: 'Last Name must not be empty'});
    } else if (req.body.phone.trim() === '') {
        return res.status(400).json({body: 'Please provide your mobile number'});
    } else if (req.body.email.trim() === '') {
        return res.status(400).json({body: 'Please provide your business email'});
    } else if (req.body.password.trim() === '') {
        return res.status(400).json({body: 'Please provide your password'});
    }  else if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({body: 'Passwords must match'});
    } else if (req.body.handle.trim() === '') {
        return res.status(400).json({body: 'handle must not be empty'});
    } else if (req.body.bio.trim() === '') {
        return res.status(400).json({body: 'bio must not be empty'});
    } else if (req.body.SMHandle.trim() === '') {
        return res.status(400).json({body: 'Please provide any of your Social media handle'});
    } else if (req.body.category.trim() === '') {
        return res.status(400).json({body: 'Please your business category'});
    } else if (req.body.addressState.trim() === '') {
        return res.status(400).json({body: 'Please provide the state your business is currently located'});
    } else if (req.body.country.trim() === '') {
        return res.status(400).json({body: 'Please provide the country your business is currently located'});
    } else if (req.body.businessName.trim() === '') {
        return res.status(400).json({body: 'Please provide business name'});
    }


    const pieDataPoor =
        {

            "id": "2",
            "label": "poor",
            "value": 0,
            "color": "#161718",
        };

    const pieDataBad =

        {

            "id": "1",
            "label": "bad",
            "value": 0,
            "color": "#F6AE5B"

        };

    const pieDataAverage =

        {

            "id": "1",
            "label": "average",
            "value": 0,
            "color": "#0B5E3F",
        };

    const pieDataGreat =

        {

            "id": "1",
            "label": "great",
            "value": 0,
            "color": "#5E0B37",
        };

    const pieDataExcellent =

        {
            "color": "#001818",
            "id": "1",
            "label": "excellent",
            "value": 0
        };


    const newBusiness = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        AddressOne: req.body.AddressOne,
        AddressTwo: req.body.AddressTwo,
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
        bio: req.body.bio,
        SMHandle: req.body.SMHandle,
        category: req.body.category,
        addressState: req.body.addressState,
        country: req.body.country,
        businessName: req.body.businessName,
        website: req.body.website,
        promoCode: req.body.promoCode,
        reviews: '0',
        followers: '0',
        invitationSent: '0',
    };

    const noImag = 'no-image.png';

    let token, businessId;
    db.doc(`/businesses/${newBusiness.handle}`).get()
        .then(doc => {

                return firebase.auth().createUserWithEmailAndPassword(newBusiness.email, newBusiness.password)

        }).then(data => {
        businessId = data.user.uid;

        const bizCredentials = {
            firstName: newBusiness.firstName,
            lastName: newBusiness.lastName,
            phone: newBusiness.phone,
            handle: newBusiness.handle,
            email: newBusiness.email,
            AddressOne: newBusiness.AddressOne,
            AddressTwo: newBusiness.AddressTwo,
            bio: newBusiness.bio,
            SMHandle: newBusiness.SMHandle,
            category: newBusiness.category,
            addressState: newBusiness.addressState,
            country: newBusiness.country,
            website: newBusiness.website,
            businessName: newBusiness.businessName,
            createdAt: new Date().toISOString(),
            subscription: true,
            claimed: true,
            approved: true,
            reviews: newBusiness.reviews,
            followers: newBusiness.followers,
            invitationSent: newBusiness.invitationSent,
            promoCode: newBusiness.promoCode,
            businessId: businessId
        };
        //adds user credentials to database
        return db.doc(`/businesses/${newBusiness.handle}`).update(bizCredentials)
            .then((doc) => {

                const addData = db.collection('reviewsChart').doc(bizCredentials.handle);

                addData.collection('pieData').doc('average').set(
                    pieDataAverage
                );
                addData.collection('pieData').doc('bad').set(
                    pieDataBad
                );
                addData.collection('pieData').doc('great').set(
                    pieDataGreat
                );
                addData.collection('pieData').doc('excellent').set(
                    pieDataExcellent
                );
                addData.collection('pieData').doc('poor').set(
                    pieDataPoor
                );
                return res.status(201).json({body: 'Account registered successfully'});


            })

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
}

exports.claim = (req, res) => {

    let business = '';
    let bizInfo = {};
    let citiesRef = db.collection('businesses');
    let query = citiesRef.where('handle', '==', req.params.handle).get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No matching documents.');
                return;
            }
            bizInfo.unClaimedBusiness = {};
            snapshot.forEach(doc => {

                bizInfo.unClaimedBusiness = doc.data();
                business = doc.data().handle
            });
            return db.collection('reviews').where('business', '==', business)
                .orderBy('createdAt', 'desc')
                .get();
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

           return res.json(bizInfo);


        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        });

};


//delete review
exports.deleteReview = (req, res) =>{
    const document = db.doc(`/reviews/${req.params.reviewId}`);
    document.get()
        .then(data =>{
            if(!data.exists){
                return res.status(400).json({error: 'Review not found'});
            }
            return document.delete();

        })
        .then(() =>{
            res.status(201).json({message: 'Review deleted'})
        })
        .catch(err=>{
            console.error(err);
            return res.status(500).json({error: err.code})
        })
};




exports.deleteBusiness = (req, res) =>{
    let handle;

    const userDoc = db.collection('businesses').where('businessId', '==', req.params.businessId).get().then((result) => {
        if (result.empty) {


            return res.status(404).json({message: 'Business not found'});

        } else {
            result.forEach((doc)=>{
             handle = doc.data().handle

        });
            admin.auth().deleteUser( req.params.businessId)
                .then(function () {
                    // console.log('Successfully deleted user');
                    db.doc(`businesses/${handle}`).delete()
                        .then((data) => {


                                        return res.status(201).json({message: 'deleted'});
                                    });
                                });


        }
    }).catch((err) => {
        return res.status(500).json({error: "Couldn't delete".err.code});
    })
};

exports.deleteReviewer = (req, res) =>{
    let userHandle;
    const userDoc = db.collection('users').where('userId', '==', req.params.userId).get().then((result) => {
        if (result.empty) {


            return res.status(404).json({message: 'User not found'});

        } else {
          result.forEach((doc)=>{
              userHandle = doc.data().handle
          });
            admin.auth().deleteUser(req.params.userId)
                .then(function () {
                    // console.log('Successfully deleted user');
                    db.doc(`/users/${userHandle}`).delete()
                        .then(() => {

                            const document = db.collection('reviews').where('userHandle', '==', userHandle);
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

//approve business function
exports.approveBusiness = (req, res) => {

    let value = true;
    db.doc(`/businesses/${req.params.handle}`).update({approved: value})
        .then(() => {
            return res.json({message: "Business approved successfully"})
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        })

};


