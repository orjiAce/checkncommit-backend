const {db, admin} = require('../util/admin');
const config = require('../util/config');


exports.getAllReviews = (req, res) => { //a get request to get all the reviews

    const reviewDocument = db.doc(`/businesses/${req.body.handle}`);
    db.collection("reviews")
        .orderBy('createdAt', 'desc').limit(20)//order the review query in descending order
        .get()
        .then(data => {
            let reviews = [];
            data.forEach((doc) => {
                reviews.push({ //get the reviews by passing them as an object
                    reviewId: doc.id,
                    body: doc.data().body,
                    title: doc.data().title,
                    handle: doc.data().userHandle,
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
                    userImage: doc.data().userImage
                });
            });
            return res.json(reviews);
        })
        .catch((err) => console.error(err))
};


//get 5star reviews

exports.topReviews = (req, res) => {
    db.collection("topReviews")
        .where("rating", "in", ["5star", "4star"])
        .orderBy('createdAt', 'desc').limit(10)//order the review query in descending order
        .get()
        .then(data => {
            if (data.empty) {
                return res.status(400).json("No reviews found");
            } else {
                let topReviews = [];
                data.forEach((doc) => {
                    topReviews.push({ //get the reviews by passing them as an object
                        reviewId: doc.id,
                        body: doc.data().body,
                        title: doc.data().title,
                        handle: doc.data().userHandle,
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
                        userImage: doc.data().userImage
                    });
                });
                return res.json(topReviews);
            }
        })
        .catch((err) => console.error(err))

};
exports.fourStarReviews = (req, res) => {
    db.collection("reviews").where("rating", "==", "4star")
        .orderBy('createdAt', 'desc').limit(10)//order the review query in descending order
        .get()
        .then(data => {
            let fourStarReviews = [];
            data.forEach((doc) => {
                fourStarReviews.push({ //get the reviews by passing them as an object
                    reviewId: doc.id,
                    body: doc.data().body,
                    title: doc.data().title,
                    handle: doc.data().userHandle,
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
                    userImage: doc.data().userImage
                });
            });
            return res.json(fourStarReviews);
        })
        .catch((err) => console.error(err))

};


//this function allow logged in users to post a review
exports.postReview = (req, res) => {


    const newReview = {
        body: req.body.body,
        userHandle: req.user.handle,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        title: req.body.title,
        rating: req.body.rating + 'star',
        userImage: req.user.imageUrl,
        /* image1: req.body.image1,*/
        replies: 0,
        reportCount: 0,
        business: req.body.business,
        customerService: req.body.customerService + 'star',
        createdAt: new Date().toISOString()
    };
    db.collection('reviews')
        .add(newReview)
        .then((doc) => {
            newReview.reviewId = doc.id;
            //res.json(newReview);
            return res.status(201).json({message: 'review submitted successfully'});
        })
        .catch((err) => {
            res.status(500).json({error: 'Something went wrong'});
            console.error(err);
        })

};


//sendReview with images


exports.uploadImg = (req, res) => {


    const inputFields = {
        title: req.body,
        body: req.body,
        ratings: req.body,
        business: req.body,
        customerService: req.body,
        createdAt: new Date().toISOString()
    };

    if (inputFields.body === '') {
        return res.status(400).json({body: 'Body must not be empty'});
    } else if (inputFields.title === '') {
        return res.status(400).json({body: 'Title must not be empty'});
    } else if (inputFields.rating === 0) {
        return res.status(400).json({body: 'Please give your Rating'});
    } else if (inputFields.customerService === 0) {
        return res.status(400).json({body: 'Please give your Customer service Rating'});
    }

    // See https://cloud.google.com/functions/docs/writing/http#multipart_data

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

    const fields = inputFields;
    const files = [];
    const fileWrites = [];
    let images = {};
    let imageFileName = {};
    let imageToAdd = {};
    let imageToBeUploaded = {};

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
        /*     Promise.all(fileWrites)
               .then(() => {
                   req.body = fields;
                   req.files = files;
                   //return res.status(201).json(imageFileName);
                  // next();*/
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
            }).then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
                config.storageBucket
            }/o/${imageFileName}?alt=media`;

            const newReview = {
                body: inputFields.body,
                userHandle: req.user.handle,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                title: inputFields.title,
                rating: inputFields.ratings + 'star',
                userImage: req.user.imageUrl,
                image: imageUrl,
                replies: 0,
                reportCount: 0,
                business: inputFields.business,
                customerService: inputFields.customerService + 'star',
                createdAt: new Date().toISOString()
            };
            return db.collection('reviews')
                .add(newReview);


        }).then((doc) => {
            return res.status(201).json({message: 'review submitted successfully'});
        })
            .catch((err) => {
                res.status(500).json({error: 'Something went wrong'});
                console.error(err);
            })

    });

    busboy.end(req.rawBody);
};


exports.sendReview = (req, res) => {

    let rating = '1star';
    let reviewImages = {};
    const inputFields = {
        title: req.body,
        body: req.body,
        ratings: req.body,
        business: req.body,
        customerService: req.body,
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
        imageToAdd = {imageFileName, filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));
        images = imagesToUpload.push(imageToAdd);

    });

    busboy.on('finish', () => {


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
            business: inputFields.business,
            customerService: inputFields.customerService + 'star',
            createdAt: new Date().toISOString()
        };


        if (newReview.rating === '1star') rating = "bad";
        if (newReview.rating === '2star') rating = "poor";
        if (newReview.rating === '3star') rating = "average";
        if (newReview.rating === '4star') rating = "great";
        if (newReview.rating === '5star') rating = "excellent";


        db.collection('reviews')
            .add(newReview)
            .then((doc) => {

            db.collection(`notifications`).add({
                sender: req.user.handle,
                type: 'review',
                reviewId: doc.id,
                recipient: inputFields.business,
                read: false,
                createdAt: new Date().toISOString(),
            }).then(r => {
                //console.log.json({response: 'notification added'});
                let chartData = {};
                let myChart = db.collection("reviewsChart").doc(newReview.business).collection("pieData").doc(rating);

                myChart.get().then((doc) => {
                    chartData = doc.data();

                    chartData.value++;
                    return myChart.update({value: chartData.value}).then(() => {
                        return res.status(201).json({message: 'review submitted successfully'});
                    })
                })
            });
//update the chart data


        })
            .catch((err) => {
                res.status(500).json({error: 'Something went wrong'});
                console.error(err);
            });
    });

    busboy.end(req.rawBody);

};


exports.recipes = (req, res) => {

    const recipeData = {
        title: req.body,
        body: req.body,
        recipe: req.body,
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

    const fields = recipeData;

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
        imageToAdd = {imageFileName, filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));
        images = imagesToUpload.push(imageToAdd);

    });

    busboy.on('finish', () => {


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
        const recipes = {
            body: recipeData.body,
            title: recipeData.title,
            recipe: recipeData.recipe,
            images: imageUrls,
            createdAt: new Date().toISOString()
        };


        db.collection('recipes')
            .add(recipes).then((doc) => {


//update the chart data

            return res.status(201).json({message: 'recipes submitted successfully'});

        })
            .catch((err) => {
                res.status(500).json({error: 'Something went wrong'});
                console.error(err);
            });
    });

    busboy.end(req.rawBody);

};


//allows user to view a review and its replies

exports.showReview = (req, res) => {
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
        return res.json(reviewData);

    }).catch(err => {
        console.error(err);
        res.status(500).json({error: err.code});
    });


};


//reply to review
exports.replyToReview = (req, res) => {

    if (req.body.message.trim() === '') return res.status(400).json({reply: 'Must not be empty!'});
    const newReply = {
        message: req.body.message,
        createdAt: new Date().toISOString(),
        userHandle: req.body.userHandle,
        // reviewId: req.params.reviewId,
        reviewId: req.body.reviewId,
        bizHandle: req.user.handle,
        //userImage: req.user.logoUrl,
    };

    db.doc(`/reviews/${req.body.reviewId}`).get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(404).json({error: 'Review not found'});
            }
            return doc.ref.update({replies: doc.data().replies + 1});
        })
        .then(() => {
            return db.collection('replies').add(newReply);
        })
        .then(() => {
            // return res.json(newReply);

            db.collection(`notifications`).add({
                sender: req.body.userHandle,
                type: 'reply',
                reviewId: req.body.reviewId,
                recipient: req.user.handle,
                read: false,
                createdAt: new Date().toISOString(),
            }).then(r => {
                return res.json({reply: 'Reply sent'});
            })
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({error: 'Something went wrong'});
        });

};

//report a review
exports.reportReview = (req, res) => {

//check if review is already reported and also check if the review actually exists
    const reportedDocument = db.collection('reports').where('bizHandle', '==', req.user.handle)
        .where('reviewId', '==', req.body.reviewId).limit(1);
    const reviewDocument = db.doc(`/reviews/${req.body.reviewId}`);

    let reviewData = {};
    reviewDocument.get()
        .then(doc => {
            //check if review exist
            if (doc.exists) {
                //if it exists then get that data
                reviewData = doc.data();
                reviewData.reviewId = doc.id;
                return reportedDocument.get();
            } else {
                return res.status(404).json({error: 'Review not found'});
            }
        })
        .then((data) => {
            //checks if review is not reported and then go ahead to report it
            if (data.empty) {
                return db.collection('reports').add({
                    //reviewId: req.params.reviewId,
                    reviewId: req.body.reviewId,
                    //TODO get user that posted the review
                    message: req.body.message,
                    bizHandle: req.user.handle,
                    userHandle: req.body.userHandle,
                    createdAt: new Date().toISOString()
                })
                    .then(() => {
                        //update the report count
                        reviewData.reportCount++;
                        return reviewDocument.update({reportCount: reviewData.reportCount})
                    })
                    //here everything is successful
                    .then(() => {
                        db.collection(`notifications`).add({
                            sender: req.user.handle,
                            type: 'report',
                            message:req.body.message,
                            reviewId: req.body.reviewId,
                            recipient: req.body.userHandle,
                            read: false,
                            createdAt: new Date().toISOString(),
                        }).then(r => {
                            //return res.json(reviewData);
                            return res.status(201).json({message: 'Review reported!'})
                        });
                    });
            } else {
                //if review is already reported by this business then they get this message
                return res.status(400).json({error: 'Review already reported!'})
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: err.code});
        })
};


//search business
exports.searchBusiness = (req, res) => {
    /*let businesses = {};
        let searchQ = db.collection('businesses').where('businessName', '<=', req.params.business ).get()
            .then(doc =>{
                if(doc.empty){
                    return  res.status(401).json({error: 'No business found'});
                }else {
                    businesses.business = [];
                    doc.forEach(result =>{
                        businesses.business =result.data();
                        return res.json(businesses);
                    });
                }
            }).catch(err =>{
                return res.status(500).json({error: err.code});
            });*/


    let searchQ = db.collection('businesses').where('businessName', '==', req.params.business)
        .get()
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
                        email: result.data().email,
                        firstName: result.data().firstName,
                        lastName: result.data().lastName,
                        bizId: result.id,
                    });

                });

                return res.json(allBusiness);
            }
        }).catch(err => {
            return res.status(500).json({error: err.code});
        });

};


exports.overallRating = (req, res) => {


    db.collection("reviewsChart").doc(req.params.businessName).collection("pieData").get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                console.log('No matching documents.');
                return res.status(400).json({error: 'No matching business'});
            }

            let overallRate = [];
            querySnapshot.forEach((doc) => {

             overallRate.push({

                    id: doc.data().id,
                    label: doc.data().label,
                    value: doc.data().value,
                    color: doc.data().color,

                })
            });
            //console.log(rating);
            return res.status(201).json(overallRate)
        }).catch((err) => {
        console.log(err.message)
    })
};




