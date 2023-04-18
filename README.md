# api-docvalidation

The document validation process is being automated by developing an Application Programming Interface (API) service that reads the document using Optical Character Recognition (OCR) and detects any human faces using a facial detection algorithm.

# Documentation

# User 
# User Signup

    /user/signup
    
- Request-Post
  {
    "emailId": String,
    "organizationName": String,
    "password": String
  }

- Response 201
  {
    "message": "User Registration Successful"
  }
    
# User Login

    /user/login
    
- Request-Post
  {
    "emailId": String,
    "password": String
  }

- Response 200
  {
    "message": "User Successfully Logged in"
  }    
  
# User Profile Details
  
    /user/profile/:emailId
      
- Request-Get
  {
    "emailId": String
  }
  
- Response 200
  {
    "message": "Success"
  }
  
# User Logout

    /user/logout
 
- Request-Post
  {
    "emailId": String
  }
   
- Response 201
  {
    "message": "Successfully Logged out"
  }
   
# For Every Error

- Response [400,401,403,404,405,406,422,500]
  {
  "detail": 
  {
  "title": String<Short Description>,
  "message" : String <Large Description>
  }
  }
  
  
    
