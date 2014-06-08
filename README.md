angular-web-api2-auth [![Build Status](https://travis-ci.org/kennethlynne/angular-web-api2-auth.png?branch=master)](https://travis-ci.org/kennethlynne/angular-web-api2-auth)
=============================

Angular provider for integration with WebAPI2 token authentication

`bower install angular-web-api2-auth`

# Usage
```javascript
//Register dependancy
angular.module('yourApp', ['kennethlynne.webAPI2Authentication'])

angular.module('yourApp').config(function (webAPIAuthProvider) {

    webAPIAuthProvider.setAPIUrl('https://your-api.com'); //Only requests to this endpoint will get the Authorization headers modified
    webAPIAuthProvider.setTokenEndpointUrl('your-api.com/token');
    webAPIAuthProvider.setExternalUserInfoEndpointUrl('your-api.com/externalUserInfo');
    webAPIAuthProvider.setRegisterExternalUserEndpointUrl('your-api.com/registerExternal');

});

angular.module('yourApp').controller(function (webAPIAuth, $window) {

    // bearer, username, password
    webAPIAuth.login('password', 'John_doe', 'password123')
    
    .then(function () {
        //Every request to the API will have its Authorization header set
        
        webAPIAuth.isLoggedIn(); //true
        
        webAPIAuth.getToken(); //Returns the token, obviously
        
        webAPIAuth.logout();
    
    })
    
    .catch()
       
    $scope.openExternalLoginWindow = function(url){
    
          function handler(event) {
              popup.close();
              var token = event.data;
              webAPIAuth
                  .getExternalUserInfo(token)
                  .then(function(userInfo){
                      if (userInfo.hasRegistered)
                        $state.go('dashboard');
                      else
                      {
                          webAPIAuth
                              .registerExternalUser(token, userInfo.userName)
                              .then(function(){
                                  $state.go('dashboard')
                              })
                      }
                  });
          }
    
          window.addEventListener('message', handler);
          var cfg = [
                                'location=false',
                                'height=650',
                                'width=600',
                                'menubar=false',
                                'toolbar=false',
                                'top=200',
                                'left=200'
                            ].join(', ');
                            
          var popup = $window.open(url, '_blank', cfg);
    
        };

});

```
