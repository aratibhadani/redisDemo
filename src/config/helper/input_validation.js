
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


function accessTokenGenerateValidation(data) {
    const schema = Joi.object({
        token: Joi.string().required().messages({
            "string.empty": "token is required!!"
        })
    }).options({ abortEarly: true });
    return schema.validate(data)
}


module.exports = { createUserValidation, loginValidation, editUserValidation,accessTokenGenerateValidation}
