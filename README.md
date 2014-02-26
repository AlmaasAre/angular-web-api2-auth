angular-web-api2-auth [![Build Status](https://travis-ci.org/kennethlynne/angular-web-api2-auth.png?branch=master)](https://travis-ci.org/kennethlynne/angular-web-api2-auth)
=============================

Angular provider for integration with WebAPI2 token authentication

`bower install angular-web-api2-auth`

# Usage
```javascript
//Register dependancy
angular.module('yourApp', ['kennethlynne.webAPI2Authentication'])

angular.module('yourApp').config(function () {

    webAPIAuthProvider.setAPIUrl('https://your-api.com'); //Only requests to this endpoint will get the Authorization headers modified
    webAPIAuthProvider.setTokenEndpointUrl('your-api.com/token');

});

angular.module('yourApp').controller(function (webAPIAuth) {

    webAPIAuth.login('password', 'John_doe', 'password123')

       .then(function () {
           //Every request to the API will have its Authorization header set

           webAPIAuth.isLoggedIn(); //true

           webAPIAuth.getToken(); //Returns the token, obviously

           webAPIAuth.logout();

       })

       .catch()

});

```