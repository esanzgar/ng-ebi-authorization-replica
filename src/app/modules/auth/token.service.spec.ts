import {
    TestBed,
    inject
} from '@angular/core/testing';

import {
    JwtHelperService
} from '@auth0/angular-jwt';
import {
    TokenService
} from './token.service';
import {
    spyOnClass
} from 'jasmine-es6-spies';

describe('Service: Token', () => {
    const jwterSpy = spyOnClass(JwtHelper);

    const fakeToken = {
        'email': 'test@ebi.ac.uk',
        'name': 'Jeff'
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{
                    provide: JwtHelperService,
                    useValue: jwterSpy
                },
                TokenService
            ]
        });
    });

    it('should instantiate', inject(
        [TokenService], (service: TokenService) => {
            expect(service).toBeTruthy();
        }));

    it('should save tokens', inject(
        [TokenService], (service: TokenService) => {
            localStorage.clear();
            service.saveToken('one');
            expect(service.getToken()).toBe('one');
            service.saveToken('another');
            expect(service.getToken()).toBe('another');
            localStorage.clear();
        }));

    it('should use the jwt helper to check if a token is expired', inject(
        [TokenService], (service: TokenService) => {

            jwterSpy.isTokenExpired.and.returnValues(true, false);

            expect(service.isTokenExpired()).toBeTruthy();
            expect(service.isTokenExpired()).toBeFalsy();
            expect(jwterSpy.isTokenExpired).toHaveBeenCalledTimes(2);
        }));

    it('should use the jwt helper to check retrieve the claims', inject(
        [TokenService], (service: TokenService) => {

            jwterSpy.decodeToken.and.returnValue(fakeToken);

            expect(service.getEmail()).toBe(fakeToken['email']);
            expect(service.getName()).toBe(fakeToken['name']);
            expect(jwterSpy.decodeToken).toHaveBeenCalledTimes(2);
        }));

    it('should not throw exceptions when getting claims from invalid tokens', inject(
        [TokenService], (service: TokenService) => {

            jwterSpy.decodeToken.and.throwError('dodgyToken');

            expect(service.getName()).toBe('');
        }));
});
