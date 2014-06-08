angular.module('kennethlynne.webAPI2Authentication', [])
  .provider('webAPIAuth', function ($httpProvider) {

    var tokenUrl = '',
      endpointUrl = '',
      logoutUrl = '',
      localStorageKey = 'token',
      externalUserInfoUrl = '',
      registerExternalUserUrl = '';

    $httpProvider.interceptors.push(['$q', '$injector', function ($q, $injector) {
      return {
        request: function (cfg) {
          var token = $injector.get('webAPIAuth').getToken();
          var matchesAPIUrl = cfg.url.substr(0, endpointUrl.length) === endpointUrl;

          if (token && matchesAPIUrl) {
            cfg.headers['Authorization'] = 'Bearer ' + token;
          }
          return cfg || $q.when(cfg);
        }
      };
    }]);

    this.setLocalstorageKey = function (key) {
      localStorageKey = key;
    };

    this.setTokenEndpointUrl = function (url) {
      tokenUrl = url;
    };

    this.setLogoutEndpointUrl = function (url) {
      logoutUrl = url;
    };

    this.setExternalUserInfoEndpointUrl = function (url) {
      externalUserInfoUrl = url;
    };

    this.setRegisterExternalUserEndpointUrl = function (url) {
      registerExternalUserUrl = url;
    };

    this.setAPIUrl = function (url) {
      endpointUrl = url;
    };

    this.$get = ['$http', '$window', '$q', function ($http, $window, $q) {

      var localStorage = $window.localStorage,
        _logout = function () {
          var deferred = $q.defer(),
            cfg = {
              method: 'POST',
              url: logoutUrl,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + _getToken()
              }
            };

          $http(cfg)
            .then(function (response) {
              if (response && response.data) {
                deferred.resolve(true);
              }
              else {
                deferred.reject('No data received');
              }
            })
            .catch(function (response) {
              var message = (response && response.data && response.data.message) ? response.data.message : '';
              deferred.reject('Could not log you out. ' + message);
            });

          localStorage.removeItem(localStorageKey);

          return deferred.promise;
        },
        _getToken = function () {
          return localStorage.getItem(localStorageKey);
        },
        _setToken = function (token) {
          return localStorage.setItem(localStorageKey, token);
        },
        _login = function (grantType, username, password) {
          var deferred = $q.defer(),
            cfg = {
              method: 'POST',
              url: tokenUrl,
              data: 'grant_type=' + grantType + '&username=' + username + '&password=' + password,
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            };

          $http(cfg)
            .then(function (response) {
              if (response && response.data) {
                _setToken(response.data.access_token);
                deferred.resolve(true);
              }
              else {
                deferred.reject('No data received');
              }
            })
            .catch(function (response) {
              var message = (response && response.data && response.data.message) ? response.data.message : '';
              deferred.reject('Could not log you in. ' + message);
            });

          return deferred.promise;

        },
        _isLoggedIn = function () {
          return typeof _getToken() == 'string';
        },
        _getExternalUserInfo = function (token) {
          var deferred = $q.defer(),
            cfg = {
              method: 'GET',
              url: externalUserInfoUrl,
              headers: {
                'Authorization': 'Bearer ' + token
              }
            };

          $http(cfg)
            .then(function (response) {
              if (response && response.data) {
                deferred.resolve(response.data);
              }
              else {
                deferred.reject('No data received');
              }
            })
            .catch(function (response) {
              var message = (response && response.data && response.data.message) ? response.data.message : '';
              deferred.reject('Could not get external user info. ' + message);
            });

          return deferred.promise;

        },
        _registerExternalUser = function (token, username) {
          var deferred = $q.defer();
          cfg = {
            method: 'POST',
            url: registerExternalUserUrl,
            data: 'userName=' + username,
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          };

          $http(cfg).then(function (response) {
            deferred.resolve(response.data);
          })
            .catch(function (response) {
              var message = (response && response.data && response.data.message) ? response.data.message : '';
              deferred.reject('Could not register external user. ' + message);
            })
            .finally(function () {
              $log.log('Register external user request finished.');
            });
          return deferred.promise();
        };


      return {
        isLoggedIn: _isLoggedIn,
        login: _login,
        getExternalUserInfo: _getExternalUserInfo,
        registerExternalUser: _registerExternalUser,
        getToken: _getToken,
        setToken: _setToken,
        logout: _logout
      }
    }];
  });
