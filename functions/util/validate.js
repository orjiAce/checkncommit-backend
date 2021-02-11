
const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false
};


// a helper function to determine if a string us empty
const isEmpty = (string) => {
    return string.trim() === '';
};



exports.validateSignUpData = (data) => {
    let errors = {};

    if (isEmpty(data.email)) {
        errors.email = 'Must not be empty';
    } else if (!isEmail(data.email)) {
        errors.email = 'Must be a valid email address';
    }

    if (isEmpty(data.password)) errors.password = 'Must not be empty';
    if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords must match';
    if (isEmpty(data.handle)) errors.handle = 'Must not be empty';
    if (isEmpty(data.location)) errors.location = 'Location is required';
    if (isEmpty(data.phone)) errors.phone = 'Phone number is required';
    if (isEmpty(data.firstName)) errors.firstName = 'First Name  is required';
    if (isEmpty(data.lastName)) errors.lastName = 'Last Name is required';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
};

exports.validateLoginData = (data) => {
    let errors = {};

    if (isEmpty(data.email)) errors.email = 'Email Must not be empty';
    if (isEmpty(data.password)) errors.password = 'Password Must not be empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
};

exports.reduceUserDetails = (data) => {
    let userDetails = {};

    if (!isEmpty(data.firstName.trim())) userDetails.firstName = data.firstName;
    if (!isEmpty(data.lastName.trim())) userDetails.lastName = data.lastName;
    if (!isEmpty(data.phone.trim())) userDetails.phone = data.phone;

    if (!isEmpty(data.location.trim())) userDetails.location = data.location;

    return userDetails;
};

//validates user updaet details
exports.reduceUserDetails = (data) => {
    let userDetails = {};
    if (!isEmpty(data.location.trim())) userDetails.location = data.location;
    if (!isEmpty(data.phone.trim())) userDetails.phone = data.phone;

//get website and format it
   /* if (!isEmpty(data.website.trim())){
    if (data.website.trim().substring(0, 4) !== 'http') {
        userDetails.website = `http://${data.website.trim()}`;
    } else userDetails.website = data.website;
        }

    */
    return userDetails ;
};







