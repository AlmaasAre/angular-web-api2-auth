angular.module('kennethlynne.webapi2auth', ['ngStorage'])
    .provider('authentication', function ($httpProvider) {

        var BaseUrl = '';
        var tokenNamespace = 'token';

        $httpProvider.interceptors.push(function ($q, $injector) {
            return {
                request: function (cfg) {
                    var token = $injector.get('authentication').getToken();
                    var matchesAPIUrl = cfg.url.substr(0, BaseUrl.length) === BaseUrl;

                    if (token && matchesAPIUrl) {
                        cfg.headers['Authorization'] = token;
                    }
                    return cfg || $q.when(cfg);
                }
            };
        });

        this.$get = function ($http, $localStorage, $log, $q) {
            var _logout = function () {
                    delete $localStorage[tokenNamespace];
                },
                _getToken = function () {
                    return $localStorage[tokenNamespace];
                },
                _login = function (grantType, username, password) {

                    var deferred = $q.defer();

                    var cfg = {
                        method: 'POST',
                        url: BaseUrl + 'token',
                        data: 'grant_type=' + grantType + '&username=' + username + '&password=' + password,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    };

                    $http(cfg).then(function (response) {
                        if (response && response.data) {
                            var data = response.data;
                            $localStorage[tokenNamespace] = data.access_token;
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
                    return typeof $localStorage[tokenNamespace] == 'string';
                };

            return {
                isLoggedIn: _isLoggedIn,
                login: _login,
                getToken: _getToken,
                logout: _logout
            }
        }
    })
    .run(function (authentication, $location) {
        authentication.isLoggedIn() || $location.path('/login')
    });
