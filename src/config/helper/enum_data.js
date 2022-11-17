const resetPasswordLink = 'http://localhost:3000/user/reset-password';
const viewTemplateLink='/home/mind/practice/articleDemo/postdemo/views'

module.exports = { 
  viewTemplateLink, //set path for email template to sending mail
  resetPasswordLink,

  SUCCESS_STATUS:200,
  CREATED_STATUS: 201,
  ACCEPTED_STATUS: 202,
  NO_CONTENT_STATUS: 204,
  BAD_REQUEST_STATUS: 400,
  UNAUTHORIZED_STATUS: 401,
  FORBIDDEN_STATUS: 403,//he client does not have access rights to the content
  PAGE_NOT_FOUND_STATUS: 404,
  METHOD_NOT_ALLOW_STATUS: 405,
  NOT_ACCEPTABLE_STATUS: 406,
  REQUEST_TIMEOUT_STATUS: 408,
  CONFLICT_STATUS: 409,
  INTERNAL_SERVER_STATUS: 500,
  BAD_GATEWAY_STATUS: 502,
  SERVICE_UNAVAILABLE_STATUS: 503
};
