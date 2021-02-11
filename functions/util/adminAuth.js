const { admin, db } = require('./admin');

module.exports = (req, res, next) => {
    let idToken;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('AdminToken ')
    ) {
        idToken = req.headers.authorization.split('AdminToken ')[1];
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
                .collection('admin')
                .where('adminId',  '==', req.user.uid)
                .limit(1)
                .get();
        })
        .then((data) => {
            req.user.email = data.docs[0].data().email;
            req.user.firstName = data.docs[0].data().firstName;
            req.user.lastName = data.docs[0].data().lastName;
            req.user.userId = data.docs[0].data().userId;
            return next();
        })
        .catch((err) => {
            console.error('Error while verifying token ', err);
            return res.status(403).json(err);
        });
};