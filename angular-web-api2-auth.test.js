'use strict';

describe('Service: webAPIAuth', function () {

    var webAPIAuth, $httpBackend, endpoint = 'url/token', $http, loginSuccessfulResponse, loginFailedResponse, logIn, localStorage, token;

    beforeEach(function () {

        token = undefined;

        localStorage = {
            setItem: jasmine.createSpy('localStorage.setItem').andCallFake(function(k, v) {token = v}),
            getItem: jasmine.createSpy('localStorage.getItem').andCallFake(function() {return token})
        };

        module('kennethlynne.webAPI2Authentication', function ($provide, webAPIAuthProvider) {
            webAPIAuthProvider.setTokenEndpointUrl(endpoint);
            $provide.value('$window', {localStorage:localStorage})
        });

        logIn = function logIn() {
            $httpBackend.expectPOST( endpoint, 'grant_type=password&username=John_doe&password=password123',
                {
                    'Content-Type':'application/x-www-form-urlencoded',
                    'Accept':'application/json, text/plain, */*'
                }).respond(200, loginSuccessfulResponse);

            webAPIAuth.login('password', 'John_doe', 'password123');
            $httpBackend.flush();
        };

        loginSuccessfulResponse = {
            "access_token":"token",
            "token_type":"bearer",
            "expires_in":1209599,
            "userName":"John_doe",
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

    it('should return undefined token when not logged in', function() {
        expect(webAPIAuth.getToken()).toBeUndefined();
    });

    it('should return the current login state', function() {
        expect(webAPIAuth.isLoggedIn()).toBeFalsy();
    });

    it('should remember token', function() {
        logIn();
        expect(webAPIAuth.getToken()).toBe('token');
    });

    it('should not decorate requests not targeted at the API with token information', function() {
        logIn();
        $httpBackend.expectGET( 'external-api', {"Accept":"application/json, text/plain, */*"} ).respond();
        $http.get('external-api');
        $httpBackend.flush();
    });

    it('should decorate all subsequent requests to the API with the token information', function() {
        logIn();
        $httpBackend.expectGET( endpoint + 'test', {"Accept":"application/json, text/plain, */*","Authorization":"token"} ).respond();
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

        expect(webAPIAuth.getToken()).toBe(null);
        expect(webAPIAuth.isLoggedIn()).toBeFalsy();

        $httpBackend.expectGET( endpoint + 'test', {"Accept":"application/json, text/plain, */*"} ).respond();
        $http.get(endpoint + 'test', {"Accept":"application/json, text/plain, */*"});
        $httpBackend.flush();
    });

    it('should save token to local storage', function() {
        expect(localStorage.setItem).not.toHaveBeenCalled();
        logIn();
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'token');
    });

    it('should use the token from local storage if defined', function() {
        token = 'awesome';
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