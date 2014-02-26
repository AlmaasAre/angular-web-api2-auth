'use strict';

describe('Service: webAPIAuth', function () {

    var webAPIAuth, $httpBackend, endpoint = 'url/token', $http, loginSuccessfullResponse, loginFailedResponse, logIn, $localStorage;

    beforeEach(function () {

        $localStorage = {};

        module('kennethlynne.webapi2auth', function ($provide, webAPIAuthProvider) {
            webAPIAuthProvider.setTokenEndpointUrl(endpoint);
            $provide.value('$localStorage', $localStorage);
        });

        logIn = function logIn() {
            $httpBackend.expectPOST( endpoint, 'grant_type=password&username=Ali&password=password123',
                {
                    'Content-Type':'application/x-www-form-urlencoded',
                    'Accept':'application/json, text/plain, */*'
                }).respond(200, loginSuccessfullResponse);

            webAPIAuth.login('password', 'Ali', 'password123');
            $httpBackend.flush();
        };

        loginSuccessfullResponse = {
            "access_token":"secret",
            "token_type":"bearer",
            "expires_in":1209599,
            "userName":"Ali",
            ".issued":"Mon, 14 Oct 2013 06:53:32 GMT",
            ".expires":"Mon, 28 Oct 2013 06:53:32 GMT"
        };

        loginFailedResponse = {
            message: 'Not authorized.'
        };

        inject(function (_webAPIAuth_, _$httpBackend_, _$http_) {
            webAPIAuth = _webAPIAuth_;
            $httpBackend = _$httpBackend_;
            $http = _$http_;
        });

    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should return the current login state', function() {
        expect(webAPIAuth.isLoggedIn()).toBeFalsy();
    });

    it('should return undefined token when not logged in', function() {
        expect(webAPIAuth.getToken()).toBeUndefined();
    });

    it('should remember token', function() {
        logIn();
        expect(webAPIAuth.getToken()).toBe('secret');
    });

    it('should not decorate requests not targeted at the API with token information', function() {
        logIn();
        $httpBackend.expectGET( 'external-api', {"Accept":"application/json, text/plain, */*"} ).respond();
        $http.get('external-api');
        $httpBackend.flush();
    });

    it('should decorate all subsequent requests to the API with the token information', function() {
        logIn();
        $httpBackend.expectGET( endpoint + 'test', {"Accept":"application/json, text/plain, */*","Authorization":"secret"} ).respond();
        $http.get( endpoint + 'test' );
        $httpBackend.flush();
    });

    it('should indicate that the user is logged in', function() {
        logIn();
        expect(webAPIAuth.isLoggedIn()).toBeTruthy();
    });

    it('should reset information on logout', function() {
        logIn();
        webAPIAuth.logout();

        expect(webAPIAuth.getToken()).toBeUndefined();
        expect(webAPIAuth.isLoggedIn()).toBeFalsy();

        $httpBackend.expectGET( endpoint + 'test', {"Accept":"application/json, text/plain, */*"} ).respond();
        $http.get(endpoint + 'test', {"Accept":"application/json, text/plain, */*"});
        $httpBackend.flush();
    });

    it('should save token to local storage', function() {
        expect($localStorage.token).toBeUndefined();
        logIn();
        expect($localStorage.token).toBe('secret');
    });

    it('should use the token from local storage if defined', function() {
        $localStorage.token = 'awesome';
        expect(webAPIAuth.getToken()).toBe('awesome');
    });

    it('should reject the promise if the password or username is wrong', function() {
        $httpBackend.expectPOST( endpoint, 'grant_type=password&username=wrong&password=pw',
            {
                'Content-Type':'application/x-www-form-urlencoded',
                'Accept':'application/json, text/plain, */*'
            }).respond(403, loginFailedResponse);

        var failed = jasmine.createSpy('failed');
        var success = jasmine.createSpy('success');
        var done = jasmine.createSpy('finally');

        webAPIAuth.login('password', 'wrong', 'pw').then(success).catch(failed).finally(done);
        $httpBackend.flush();

        expect(failed).toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
    });

});