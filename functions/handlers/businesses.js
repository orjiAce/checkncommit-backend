const {db, admin} = require('../util/admin');
const config = require('../util/config');
const firebase = require('firebase');
const {validateLoginData} = require("../util/validate");
/*
const cors = require('cors');
const https = require('follow-redirects').https;

const fs = require('fs');

const qs = require('querystring');
*/

exports.registerBusiness = (req, res) => {

    if (req.body.firstName.trim() === '') {
        return res.status(400).json({body: 'First name must not be empty'});
    } else if (req.body.lastName.trim() === '') {
        return res.status(400).json({body: 'Last Name must not be empty'});
    } else if (req.body.AddressOne.trim() === '') {
        return res.status(400).json({body: 'Please give your business address'});
    } else if (req.body.phone.trim() === '') {
        return res.status(400).json({body: 'Please provide your mobile number'});
    } else if (req.body.email.trim() === '') {
        return res.status(400).json({body: 'Please provide your business email'});
    } else if (req.body.password.trim() === '') {
        return res.status(400).json({body: 'Please provide your business email'});
    } else if (req.body.confirmPassword.trim() === '') {
        return res.status(400).json({body: 'Please provide your business email'});
    } else if (req.body.password !== req.body.confirmPassword) {
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
        plan: req.body.plan,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        AddressOne: req.body.AddressOne,
        AddressTwo: req.body.AddressTwo,
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle.toLowerCase(),
        bio: req.body.bio,
        SMHandle: req.body.SMHandle,
        category: req.body.category,
        addressState: req.body.addressState,
        country: req.body.country,
        businessName: req.body.businessName.toLowerCase(),
        website: req.body.website,
        reviews: '0',
        followers: '0',
        invitationSent: '0',
    };

    const noImag = 'no-image.png';

    let token, businessId;
    db.doc(`/businesses/${newBusiness.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({userHandle: 'this handle is already taken'});
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newBusiness.email, newBusiness.password)
            }
        }).then(data => {
        businessId = data.user.uid;

        const bizCredentials = {
            firstName: newBusiness.firstName,
            lastName: newBusiness.lastName,
            phone: newBusiness.phone,
            handle: newBusiness.handle.toLowerCase(),
            email: newBusiness.email,
            AddressOne: newBusiness.AddressOne,
            AddressTwo: newBusiness.AddressTwo,
            bio: newBusiness.bio,
            SMHandle: newBusiness.SMHandle,
            category: newBusiness.category,
            addressState: newBusiness.addressState,
            country: newBusiness.country,
            website: newBusiness.website,
            businessName: newBusiness.businessName.toLowerCase(),
            createdAt: new Date().toISOString(),
            subscription: false,
            claimed: true,
            approved: false,
            reviews: newBusiness.reviews,
            followers: newBusiness.followers,
            invitationSent: newBusiness.invitationSent,
            logoUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImag}?alt=media`,
            businessId: businessId
        };
        //adds user credentials to database
        return db.doc(`/businesses/${bizCredentials.handle}`).set(bizCredentials)
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
};

exports.checkBusinessName = (req, res) => {
    // db.doc(`/businesses/${req.params.businessName.toLowerCase()}`).get()
    db.collection("businesses")
        .where("businessName", "==", req.params.businessName.toLowerCase()).get()
        .then(doc => {
            console.log(req.body.businessName);
            if (!doc.empty) {
                return res.status(400).json({error: 'taken'});
            } else {
                return res.status(201).json({message: 'ok'});

            }
        }).catch((err) => {
        return res.status(500).json({error: err.code});
    })
};

exports.checkEmail = (req, res) => {
    db.collection("businesses")
        .where("email", "==", req.params.email).get()
        .then(doc => {
            console.log(req.body.email);
            if (!doc.empty) {
                return res.status(400).json({error: 'taken'});
            } else {
                return res.status(201).json({message: 'ok'});

            }
        }).catch((err) => {
        return res.status(400).json({error: err.code});
    })
};


exports.registerWithProof = (req, res) => {


    const request = require('request');

    const newBusiness = {
        firstName: req.body,
        lastName: req.body,
        AddressOne: req.body,
        AddressTwo: req.body,
        phone: req.body,
        email: req.body,
        password: req.body,
        confirmPassword: req.body,
        handle: req.body,
        bio: req.body,
        SMHandle: req.body,
        category: req.body,
        addressState: req.body,
        country: req.body,
        businessName: req.body,
        plan: req.body,
        website: req.body,
        reviews: '0',
        followers: '0',
        invitationSent: '0',
    };


    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({headers: req.headers});

    const fields = newBusiness;
    const files = [];
    const fileWrites = [];

    let imageToBeUploaded = {};
    let imageFileName;
    // Note: os.tmpdir() points to an in-memory file system on GCF
    // Thus, any files in it must fit in the instance's memory.
    const tmpdir = os.tmpdir();

    busboy.on('field', (key, value) => {
        // You could do additional deserialization logic here, values will just be
        // strings
        fields[key] = value;
    });


    if (req.body.firstName === '') {
        return res.status(400).json({body: 'First name must not be empty'});
    } else if (req.body.lastName === '') {
        return res.status(400).json({body: 'Last Name must not be empty'});
    } else if (req.body.AddressOne === '') {
        return res.status(400).json({body: 'Please give your business address'});
    } else if (req.body.phone === '') {
        return res.status(400).json({body: 'Please provide your mobile number'});
    } else if (req.body.email === '') {
        return res.status(400).json({body: 'Please provide your business email'});
    } else if (req.body.password === '') {
        return res.status(400).json({body: 'Please provide your business email'});
    } else if (req.body.confirmPassword === '') {
        return res.status(400).json({body: 'Please provide your business email'});
    } else if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({body: 'Passwords must match'});
    } else if (req.body.handle === '') {
        return res.status(400).json({body: 'handle must not be empty'});
    } else if (req.body.bio === '') {
        return res.status(400).json({body: 'bio must not be empty'});
    } else if (req.body.SMHandle === '') {
        return res.status(400).json({body: 'Please provide any of your Social media handle'});
    } else if (req.body.category === '') {
        return res.status(400).json({body: 'Please your business category'});
    } else if (req.body.addressState === '') {
        return res.status(400).json({body: 'Please provide the state your business is currently located'});
    } else if (req.body.country === '') {
        return res.status(400).json({body: 'Please provide the country your business is currently located'});
    } else if (req.body.businessName === '') {
        return res.status(400).json({body: 'Please provide business name'});
    }


    const pieDataBad =

        {

            "id": "1",
            "label": "bad",
            "value": 0,
            "color": "#F6AE5B"

        };

    const pieDataAverage =

        {

            "id": "average",
            "label": "average",
            "value": 0,
            "color": "#0B5E3F",
        };

    const pieDataGreat =

        {

            "id": "great",
            "label": "great",
            "value": 0,
            "color": "#5E0B37",
        };

    const pieDataExcellent =

        {
            "color": "#001818",
            "id": "excellent",
            "label": "excellent",
            "value": 0
        };

    const pieDataPoor =
        {

            "id": "poor",
            "label": "poor",
            "value": 0,
            "color": "#161718",
        };

    const noImag = 'no-image.png';


    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname, file, filename, encoding, mimetype);

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


        const file = `https://firebasestorage.googleapis.com/v0/b/${
            config.storageBucket
        }/o/${imageFileName}?alt=media`;
        let token, businessId;
        db.doc(`/businesses/${req.body.businessName}`).get()
            .then(doc => {
                console.log(newBusiness.handle);
                if (doc.exists) {
                    return res.status(400).json({userHandle: 'this handle is already taken'});
                } else {
                    return firebase.auth().createUserWithEmailAndPassword(newBusiness.email, newBusiness.password)
                }


            })
            .then(data => {

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

                        businessId = data.user.uid;


                        const bizCredentials = {
                            firstName: newBusiness.firstName,
                            lastName: newBusiness.lastName,
                            phone: newBusiness.phone,
                            email: newBusiness.email,
                            AddressOne: newBusiness.AddressOne,
                            AddressTwo: newBusiness.AddressTwo,
                            bio: newBusiness.bio,
                            plan: newBusiness.plan,
                            SMHandle: newBusiness.SMHandle,
                            category: newBusiness.category,
                            addressState: newBusiness.addressState,
                            country: newBusiness.country,
                            website: newBusiness.website,
                            businessName: newBusiness.businessName.toLowerCase(),
                            handle: newBusiness.businessName.toLowerCase(),
                            createdAt: new Date().toISOString(),
                            subscription: false,
                            claimed: true,
                            approved: false,
                            proof: file,
                            reviews: newBusiness.reviews,
                            followers: newBusiness.followers,
                            invitationSent: newBusiness.invitationSent,
                            logoUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImag}?alt=media`,
                            businessId: businessId
                        };


                        return db.doc(`/businesses/${bizCredentials.businessName}`).set(bizCredentials)
                            .then((doc) => {

                                const addData = db.collection('reviewsChart').doc(bizCredentials.businessName);

                                addData.collection('pieData').doc('poor').set(
                                    pieDataPoor
                                );

                                addData.collection('pieData').doc('bad').set(
                                    pieDataBad
                                );
                                addData.collection('pieData').doc('great').set(
                                    pieDataGreat
                                );


                                addData.collection('pieData').doc('average').set(
                                    pieDataAverage
                                );

                                addData.collection('pieData').doc('excellent').set(
                                    pieDataExcellent
                                );
                                /* const options = {
                                     'method': 'POST',
                                     'url': 'https://api.paystack.co/subscription',
                                     'headers': {
                                         'origin': 'x-requested-with',
                                         "Access-Control-Allow-Origin": "*",
                                         'Content-Type': 'multipart/form-data',
                                         'Authorization': 'Bearer sk_live_11cbf1f6f1e86908c4880e84821c615112536424',
                                         'Cookie': '__cfduid=de8e1f82649ac040d9cb46f111211d4ff1585684793; sails.sid=s%3AxueyS7SbIg4DoGSVMY4Otp_AkF7J4bde.AjRKwwred1aDKoLw9pB8nASOBcNZlBuq2XItORH%2BQpo'
                                     },*/
                                const request = require('request');
                                const options = {
                                    'method': 'POST',
                                    'url': 'https://api.paystack.co/subscription',
                                    'headers': {
                                        'Authorization': 'Bearer sk_live_11cbf1f6f1e86908c4880e84821c615112536424',
                                        'Content-Type': 'application/json'
                                    },

                                    form: {
                                        'customer': newBusiness.email,
                                        'plan': newBusiness.plan,
                                        'phone': newBusiness.phone,
                                        'start_date': '2020-06-02T00:30:13+01:00'

                                    }


                                };
                                request(options, function (error, response) {
                                    if (error) throw new Error(error);
                                    console.log(response.body);
                                    //return res.status(201).json(response.body)

                                });
                                return res.status(201).json({body: 'Account registered successfully'});


                            });


                    });


            })

            .catch((err) => {
                //properly checks if another user is already registered with this email
                if (err.code === 'auth/email-already-in-use') {
                    return res.status(400).json({general: 'Email is already in use'})
                } else if (err.code === 'auth/weak-password') {
                    return res.status(500).json({general: 'Weak Password, Password should be at least 6 characters '});
                }
                {
                    return res.status(500).json({general: 'Something went wrong please try again '});
                }
            })
    });


    busboy.end(req.rawBody);
};

exports.createSubscription = (req, response, next) => {

    const data = qs.stringify({
        'customer': 'CUS_sqb2flup7agyo4h',
        'plan': 'PLN_3vhjsiitolr0b2b',
    });
    const options = {
        'method': 'POST',
        'hostname': 'api.paystack.co',
        'path': 'https://api.paystack.co/subscription',
        'headers': {
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Origin': '*',
            'Authorization': 'Bearer sk_test_83eef9f2cda6df527088b635e03d293a33428606',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        'maxRedirects': 20
    };

    req = https.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function (chunk) {
            const body = Buffer.concat(chunks);
            //console.log(body.toString());
            return response.status(201).json({success: 'Subscribed to plan'});
        });

        res.on("error", function (error) {
            // console.error(error);
            return response.status(400).json({error: 'Error'});
        });
    });


    req.write(data);

    req.end();

};

exports.subCustomer = (req, res) => {
    const newBusiness = {
        customer: req.body,
        plan: req.body,
    };

    const request = require('request');
    const options = {
        'method': 'POST',
        'url': 'https://api.paystack.co/subscription',
        'headers': {
            'Content-Type': ['application/json', 'application/x-www-form-urlencoded'],
            "Access-Control-Allow-Origin": "*",
            'Authorization': 'Bearer sk_live_11cbf1f6f1e86908c4880e84821c615112536424',
            'Cookie': '__cfduid=de8e1f82649ac040d9cb46f111211d4ff1585684793; sails.sid=s%3AxueyS7SbIg4DoGSVMY4Otp_AkF7J4bde.AjRKwwred1aDKoLw9pB8nASOBcNZlBuq2XItORH%2BQpo'

        },
        form: {
            'customer': 'CUS_1zwk38b28x5jlim',
            'plan': 'PLN_3vhjsiitolr0b2b'
        }


    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        return res.json(response.body)
    });

};


exports.loginBusiness = (req, res) => {

    const businessUser = {
        email: req.body.email,
        password: req.body.password
    };

    const {valid, errors} = validateLoginData(businessUser);
    if (!valid) return res.status(400).json(errors);


    db.collection("businesses")
        .where("email", "==", businessUser.email).get()
        .then(result => {
            if (!result.empty) {
                result.forEach(doc => {

                    if (doc.data().approved === false) {
                        return res.status(403).json({general: 'Business not approved yet'});
                        console.log("Business not approved yet")
                    } else {
                        firebase.auth().signInWithEmailAndPassword(businessUser.email, businessUser.password).then((snapShot) => {
                            return snapShot.user.getIdToken()
                        })
                            .then((token) => {
                                return res.json({token});
                            }).catch((err) => {
                            console.error(err);
                            if (err.code === 'auth/user-not-found') {
                                return res.status(403).json({general: 'No registered user with this email'});
                            }
                            if (err.code === 'auth/network-request-failed') {
                                return res.status(403).json({general: 'Network error, please try again'});
                            }
                            if (err.code === 'auth/wrong-password') {
                                return res.status(403).json({general: 'Password is incorrect'});
                            } else
                                return res.status(500).json({general: 'Something went wrong please try again'});
                        });

                    }
                })

            } else {
                return res.status(500).json({general: 'No registered user with this email'});
            }

        }).catch((err) => {
        res.status(500).json({error: 'Something went wrong'});
        console.error(err);
    })


};


exports.createReview = (req, res) => {
    const noImag = 'no-image.png';
    const tempBizInfo = {

        AddressOne: req.body.AddressOne,

        email: req.body.email,
        password: "12220300300000",
        //confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,

        SMHandle: req.body.SMHandle,
        category: req.body.category,

        country: req.body.country,
        businessName: req.body.businessName,
        //review data
        body: req.body.body,
        title: req.body.title,
        rating: req.body.rating,
        /* image1: req.body.image1,*/
        replies: 0,
        reportCount: 0,
        customerService: req.body.customerService,
        createdAt: new Date().toISOString()
    };
    const newReview = {
        body: tempBizInfo.body,
        title: tempBizInfo.title,
        rating: req.body.rating + 'star',
        /* image1: req.body.image1,*/
        replies: 0,
        reportCount: 0,
        business: tempBizInfo.businessName,
        customerService: tempBizInfo.customerService + 'star',
        createdAt: new Date().toISOString()
    };
    db.collection('reviews')
        .add(newReview)
        .then((doc) => {
            const resReview = newReview;
            resReview.reviewId = doc.id;
            res.json(newReview)

        })
        .then(() => {
            /*   return res.status(201).json({error: 'review submitted successfully'});*/
            return res.status(400).json({body: 'review submitted successfully'});
        })
        .catch((err) => {
            res.status(500).json({error: 'Something went wrong'});
            console.error(err);
        })

    //return res.json(tempBizInfo);


};

exports.getBusinessData = (req, res) => {
    let bizInfo = {};
    db.doc(`/businesses/${req.user.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                bizInfo.business = doc.data();
                return db.collection('reviews').where('business', '==', req.user.handle)
                    .orderBy('createdAt', 'desc')
                    .get();

            } else {
                return res.status(400).json("Business Not Found")

            }
        }).then(data => {
        bizInfo.reviews = [];
        data.forEach((doc) => {
            bizInfo.reviews.push({
                body: doc.data().body,
                createdAt: doc.data().createdAt,
                handle: doc.data().userHandle,
                userHandle: doc.data().userHandle,
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
        });
        //
        return db.collection("notifications").where("recipient", "==", req.user.handle)
            .orderBy('createdAt', 'desc').limit(10).get()

    }).then((data) => {
        bizInfo.notifications = [];
        data.forEach((doc) => {
            bizInfo.notifications.push({
                recipient: doc.data().recipient,
                sender: doc.data().sender,
                createdAt: doc.data().createdAt,
                reviewId: doc.data().reviewId,
                type: doc.data().type,
                read: doc.data().read,
                notificationId: doc.id
            })
        });

        return db.collection('tips').orderBy('createdAt', 'desc').limit(1).get()
    })
        .then((data) => {
            bizInfo.myTips = [];
            data.forEach((doc) => {

                bizInfo.myTips.push({
                    tipText: doc.data().tipText,
                    tipId: doc.id

                })
            });
            //return res.json(bizInfo);
            return db.collection("reviewsChart").doc(req.user.handle).collection("pieData").get()
        }).then((querySnapshot) => {
        bizInfo.chartsData = [];
        querySnapshot.forEach(doc => {
            bizInfo.chartsData.push({
                id: doc.data().id,
                label: doc.data().label,
                value: doc.data().value,
                color: doc.data().color,
            });
            /*  console.log(doc.id, " => ", doc.data());
             return res.json(doc.data());*/

        });

        return db.collection("reports")
            .where("bizHandle", "==", req.user.handle).get()

    }).then((data) => {
        bizInfo.reports = [];
        data.forEach((doc) => {
            bizInfo.reports.push({
                bizHandle: doc.data().bizHandle,
                message: doc.data().message,
                reviewId: doc.data().reviewId,
                userHandle: doc.data().userHandle,
            });

        });

        return db.collection("gallery")
            .where("bizHandle", "==", req.user.handle).get()
    })
        .then((data) => {
            bizInfo.gallery = [];
            data.forEach((doc) => {
                bizInfo.gallery.push({
                    bizHandle: doc.data().bizHandle,
                    imageUrl: doc.data().imageUrl,
                    imageId: doc.id,
                    caption: doc.data().caption,
                    imageName: doc.data().imageName,
                    createdAt: doc.data().createdAt,
                });
            });
            return db.collection("videoGallery").where("bizHandle", "==", req.user.handle).get()
    })
        .then((data) => {
            bizInfo.videoGallery = [];
            data.forEach((doc) => {
                bizInfo.videoGallery.push({
                    bizHandle: doc.data().bizHandle,
                    videoUrl: doc.data().videoUrl,
                    videoId: doc.id,
                    caption: doc.data().caption,
                    videoName: doc.data().videoName,
                    createdAt: doc.data().createdAt,
                });
            });
            return db.collection('following').where('business', '==', req.user.handle).get()
        }).then((data) => {
        bizInfo.followers = [];
        data.forEach((doc) => {
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
        })

};

exports.getTips = (req, res) => {
    db.collection('tips').orderBy('createdAt', 'desc').limit(1).get()
        .then(data => {
            let tips = [];
            data.forEach((doc) => {

                tips.push({
                    tipText: doc.data().tipText

                })
            });
            return res.json(tips);
        }).catch(err => {
        return res.status(500).json({error: err.code});
    })
};

exports.getAuthBusinessData = (req, res) => {


};

exports.getPieChartData = (req, res) => {


    let pieData = {};
//FOR the chart data it is stored in the subcollection of reviewsChart
    db.collection("reviewsChart").doc(req.user.handle).collection("pieData").get()
        .then(querySnapshot => {
            pieData.chartsData = [];
            querySnapshot.forEach(doc => {
                pieData.chartsData.push({
                    id: doc.data().id,
                    label: doc.data().label,
                    value: doc.data().value,
                    color: doc.data().color,
                });
                /*  console.log(doc.id, " => ", doc.data());
                 return res.json(doc.data());*/

            });
            return res.json(pieData);
        })

        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        })

};


exports.updateBusinessInfo = (req, res) => {


    if (req.body.firstName.trim() === '') {
        return res.status(400).json({body: 'First name must not be empty'});
    } else if (req.body.lastName.trim() === '') {
        return res.status(400).json({body: 'Last Name must not be empty'});
    } else if (req.body.AddressOne.trim() === '') {
        return res.status(400).json({body: 'Please give your business address'});
    } else if (req.body.phone.trim() === '') {
        return res.status(400).json({body: 'Please provide mobile number'});
    } else if (req.body.bio.trim() === '') {
        return res.status(400).json({body: 'Bio cannot be empty'});
    } else if (req.body.SMHandle.trim() === '') {
        return res.status(400).json({body: 'Social media cannot be empty'});
    }

    const newDetail = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        AddressOne: req.body.AddressOne,
        phone: req.body.phone,
        bio: req.body.bio,
        SMHandle: req.body.SMHandle
    };

    db.doc(`/businesses/${req.user.handle}`).update(newDetail)
        .then(() => {
            return res.json({message: "Details updated successfully"})
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        })

};

exports.resetPassword = (req, res) => {


    firebase.auth().sendPasswordResetEmail(req.body.email)
        .then((user) => {
            return res.json({message: "Please check your email to reset password"})
        }).catch((err) => {
        if (err.code === 'auth/user-not-found') {
            return res.status(500).json({error: 'Sorry no user with this email'});
        }


        return res.status(500).json({general: 'Something went wrong please try again '});


    });

};

//upload


exports.updateBizLogo = (req, res) => {
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
                const logoUrl = `https://firebasestorage.googleapis.com/v0/b/${
                    config.storageBucket
                }/o/${imageFileName}?alt=media`;
                return db.doc(`/businesses/${req.user.handle}`).update({logoUrl});
            })
            .then(() => {
                return res.json({message: 'image uploaded successfully'});
            })
            .catch((err) => {
                console.error(err);
                return res.status(500).json({error: 'something went wrong'});
            });
    });
    busboy.end(req.rawBody);
};


exports.galleryUpload = (req, res) => {

    const inputFields = {
        caption: req.body,
    };
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({headers: req.headers});

    const fields = inputFields;

    // Note: os.tmpdir() points to an in-memory file system on GCF
    // Thus, any files in it must fit in the instance's memory.
    const tmpdir = os.tmpdir();

    busboy.on('field', (key, value) => {
        // You could do additional deserialization logic here, values will just be
        // strings
        fields[key] = value;
    });
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

                const logoUrl = `https://firebasestorage.googleapis.com/v0/b/${
                    config.storageBucket
                }/o/${imageFileName}?alt=media`;

                const images = {
                    caption: inputFields.caption,
                    imageName: imageFileName,
                    imageUrl: logoUrl,
                    bizHandle: req.user.handle,
                    createdAt: new Date().toISOString()
                };
                return db.collection('gallery').add(images);
            })
            .then(() => {
                return res.json({message: 'image uploaded successfully'});
            })
            .catch((err) => {
                console.error(err);
                return res.status(500).json({error: 'something went wrong'});
            });
    });
    busboy.end(req.rawBody);
};


exports.deleteImage = (req, res) => {
    const defaultStorage = admin.storage();

    const document = db.doc(`/gallery/${req.body.imageId}`);
    document.get()
        .then(doc => {

            if (!doc.exists) {
                return res.status(400).json({error: 'Image not found!'});
            }
            {
                const bucket = defaultStorage.bucket();
                const file = bucket.file(doc.data().imageName);
                console.log(doc.data().imageName);
                file.delete().then(() => {
                    return document.delete();
                });
            }
        })
        .then(() => {
            return res.status(201).json({message: 'Image deleted!'})
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code})
        })


};

exports.uploadVideo = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    let videoToBeUploaded = {};
    let videoFileName;

    const inputFields = {

        caption: req.body,
        createdAt: new Date().toISOString()
    };
    const busboy = new BusBoy({
        headers: req.headers,
        limits: {
            // Cloud functions impose this restriction anyway
            fileSize: 10 * 1024 * 1024,
        }

    });
    const fields = inputFields;
    busboy.on('field', (key, value) => {
        // You could do additional deserialization logic here, values will just be
        // strings
        fields[key] = value;
    });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname, file, filename, encoding, mimetype);
        if (mimetype !== 'video/mp4' && mimetype !== 'video/mkv') {
            return res.status(400).json({error: 'Wrong file type submitted'});
        }
        // my.image.png => ['my', 'image', 'png']
        const videoExtension = filename.split('.')[filename.split('.').length - 1];
        // 32756238461724837.png
        videoFileName = `${Math.round(
            Math.random() * 1000000000000
        ).toString()}.${videoExtension}`;
        const filepath = path.join(os.tmpdir(), videoFileName);
        videoToBeUploaded = {filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', () => {

        admin
            .storage()
            .bucket()
            .upload(videoToBeUploaded.filepath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: videoToBeUploaded.mimetype
                    }
                }
            })
            .then(() => {
                const videoUrl = `https://firebasestorage.googleapis.com/v0/b/${
                    config.storageBucket
                }/o/${videoFileName}?alt=media`;

                const videoInfo = {
                    caption: inputFields.caption,
                    videoName: videoFileName,
                    videoUrl: videoUrl,
                    bizHandle: req.user.handle,
                    createdAt: new Date().toISOString()
                };
                //console.log("uploaded");
                // return res.json({videoInfo})
                return db.collection('videoGallery').add(videoInfo);
            })
            .then(() => {
                return res.json({message: 'Video uploaded successfully'});
            })
            .catch((err) => {
                console.error(err);
                return res.status(500).json({error: 'something went wrong'});
            });
    });
    busboy.end(req.rawBody)
};


exports.cancelSubscription = (req, res) => {
    const subscription = false;
    let doc = db.doc(`/businesses/${req.user.handle}`).update({subscription})
        .then((doc) => {
            return res.status(201).json({message: 'Subscription canceled!'})
        }).then((err) => {
            return res.status(201).json({error: 'Something went wrong'})
        })
};




