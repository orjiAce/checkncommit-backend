const { admin, db } = require('./admin');

module.exports = (req, res, next) => {
    let idToken;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('BizToken ')
    ) {
        idToken = req.headers.authorization.split('BizToken ')[1];
    } else {
        console.error('No token found');
        return res.status(403).json({ error: 'Unauthorized' });
    }
//this verifies logged in user and gets their data
    admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
            req.user = decodedToken;
            return db
                .collection('businesses')
                .where('businessId',  '==', req.user.uid)
                .limit(1)
                .get();
        })
        .then((data) => {
            req.user.email = data.docs[0].data().email;
            req.user.handle = data.docs[0].data().handle;
            req.user.businessName = data.docs[0].data().businessName;
            req.user.firstName = data.docs[0].data().firstName;
            req.user.lastName = data.docs[0].data().lastName;
            req.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
        })
        .catch((err) => {
            console.error('Error while verifying token ', err);
            return res.status(403).json(err);
        });
};