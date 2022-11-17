
const Joi = require('joi');
function createUserValidation(data) {
    const schema = Joi.object({
        name: Joi.string().required().messages({
            "string.empty": "User name is required!!",
        }),
        email: Joi.string().email().required().messages({
            "string.empty": "email is required!!",
            "string.email": "Enter email in Proper Formate"
        }),
        contactno: Joi.string().regex(/^[0-9]{10}$/).required().messages({
            "string.empty": "Contact Number is required!!",
            "string.pattern.base": "Contact number must have 10 digits."
        }),
        password: Joi.string().required().min(8).max(15).messages({
            "string.empty": "password is required!!",
            "string.min": "minimum password lenth 8 character",
            "string.max": "maximum password lenth 15 character"
        }),
        confirmPassword: Joi.any().valid(Joi.ref('password')).messages({
            "any.only": "Confirm password not match with password!!",
        })
    }).options({ abortEarly: true });
    return schema.validate(data)
}
function editUserValidation(data) {
    const schema = Joi.object({
        name: Joi.string().required().messages({
            "string.empty": "User name is required!!",
        }),
        email: Joi.string().email().required().messages({
            "string.empty": "email is required!!",
            "string.email": "Enter email in Proper Formate"
        }),
        contactno: Joi.string().regex(/^[0-9]{10}$/).required().messages({
            "string.empty": "Contact Number is required!!",
            "string.pattern.base": "Contact number must have 10 digits."
        })
    }).options({ abortEarly: true });
    return schema.validate(data)
}
function loginValidation(data) {
    const schema = Joi.object({
        email: Joi.string().email().required().messages({
            "string.empty": "email is required!!",
            "string.email": "Enter email in Proper Formate"
        }),
        password: Joi.string().required().messages({
            "string.empty": "password is required!!",
        }),
    }).options({ abortEarly: true });
    return schema.validate(data)
}


//use for change Password
function changePasswordValidation(data) {
    const schema = Joi.object({
        oldPassword: Joi.string().required().min(8).max(15).messages({
            "string.empty": "Old Password is required!!",
            "string.min": "minimum password lenth 8 character",
            "string.max": "maximum password lenth 15 character"
        }),
        newPassword: Joi.string().required().min(8).max(15).messages({
            "string.empty": "New Password is required!!",
            "string.min": "minimum password lenth 8 character",
            "string.max": "maximum password lenth 15 character"
        }),
        confirmPassword: Joi.any().valid(Joi.ref('newPassword')).messages({
            "any.only": "Confirm password not match with password!!",
        })
    }).options({ abortEarly: true });
    return schema.validate(data)
}
//for forget password
function forgetPasswordValidation(data) {
    const schema = Joi.object({
        email: Joi.string().email().required().messages({
            "string.empty": "email is required!!",
            "string.email": "Enter email in Proper Formate"
        })
    }).options({ abortEarly: true });
    return schema.validate(data)
}


//after forget password
function changeForgetPasswordValidation(data) {
    const schema = Joi.object({
        password: Joi.string().required().min(8).max(15).messages({
            "string.empty": "Password is required!!",
            "string.min": "minimum password lenth 8 character",
            "string.max": "maximum password lenth 15 character"
        }),
        confirmpassword: Joi.any().valid(Joi.ref('password')).messages({
            "any.only": "Confirm password not match with password!!",
            "object.unknown":"Confirm Password Field is required"
        })
    }).options({ abortEarly: true });
    return schema.validate(data)
}


module.exports = { createUserValidation, loginValidation, changePasswordValidation,changeForgetPasswordValidation ,forgetPasswordValidation,editUserValidation}
