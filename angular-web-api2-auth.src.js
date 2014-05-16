angular.module('kennethlynne.webAPI2Authentication', [])
  .provider('webAPIAuth', function ($httpProvider) {

    var tokenUrl = '',
      endpointUrl = '',
      localStorageKey = 'token';

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

    this.setAPIUrl = function (url) {
      endpointUrl = url;
    };

    this.$get = ['$http', '$window', '$log', '$q', function ($http, $window, $log, $q) {

      var localStorage = $window.localStorage,
        _logout = function () {
          localStorage.removeItem(localStorageKey);
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
        };

      return {
        isLoggedIn: _isLoggedIn,
        login: _login,
        getToken: _getToken,
        setToken: _setToken,
        logout: _logout
      }
    }];
  });
