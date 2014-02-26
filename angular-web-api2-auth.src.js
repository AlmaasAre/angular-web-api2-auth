angular.module('kennethlynne.webAPI2Authentication', [])
    .provider('webAPIAuth', function ($httpProvider) {

        var tokenUrl = 'token';

        $httpProvider.interceptors.push(['$q', '$injector', function ($q, $injector) {
            return {
                request: function (cfg) {
                    var token = $injector.get('webAPIAuth').getToken();
                    var matchesAPIUrl = cfg.url.substr(0, tokenUrl.length) === tokenUrl;

                    if (token && matchesAPIUrl) {
                        cfg.headers['Authorization'] = token;
                    }
                    return cfg || $q.when(cfg);
                }
            };
        }]);

        this.setTokenEndpointUrl = function (url) {
            tokenUrl = url;
        };

        this.$get = ['$http', '$window', '$log', '$q', function ($http, $window, $log, $q) {

            var localStorage = $window.localStorage;

            var _logout = function () {
                    localStorage.setItem('token', null);
                },
                _getToken = function () {
                    return localStorage.getItem('token');
                },
                _login = function (grantType, username, password) {

                    var deferred = $q.defer();

                    var cfg = {
                        method: 'POST',
                        url: tokenUrl,
                        data: 'grant_type=' + grantType + '&username=' + username + '&password=' + password,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    };

                    $http(cfg).then(function (response) {
                        if (response && response.data) {
                            var data = response.data;
                            localStorage.setItem('token', data.access_token);
                            deferred.resolve(true);
                        }
                        else
                        {
                            deferred.reject('No data received');
                        }
                    })
                        .catch(function (response) {
                            var message = (response && response.data && response.data.message) ? response.data.message : '';
                            deferred.reject('Could not log you in. ' + message);
                        })
                        .finally(function () {
                            $log.log('Log in request finished.');
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
                logout: _logout
            }
        }];
    });