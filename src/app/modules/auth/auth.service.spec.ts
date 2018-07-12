import {
    TestBed,
    inject,
    fakeAsync,
    flushMicrotasks
} from '@angular/core/testing';

import {
    AuthService
} from './auth.service';
import {
    TokenService
} from './token.service';
import {
    JWT_OPTIONS,
    JwtHelperService
} from '@auth0/angular-jwt';
import {
    VALID_TOKEN,
    EXPIRED_TOKEN
} from 'app/../../testing/tokens';
import {
    AAP_CONFIG,
    DEFAULT_CONF
} from './auth.config';

describe('AuthService with a non-expired token', () => {

    let service: AuthService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{
                    provide: JWT_OPTIONS,
                    useValue: {
                        tokenGetter: () => VALID_TOKEN
                    }
                },
                JwtHelperService,
                TokenService,
                {
                    provide: AAP_CONFIG,
                    useValue: DEFAULT_CONF
                },
                AuthService
            ]
        });
    });

    beforeEach(inject([AuthService], (serv: AuthService) => { service = serv; }));

    it('must be created', () => {
        expect(service).toBeTruthy();
    });

    it('must provide a user with valid fields', () => {
        const users = service.user();
        users.subscribe(user => {
            if (user != null) {
                expect(user.uid).toEqual('usr-75f4b000');
                expect(user.name).toEqual('Ed Munden Gras');
                expect(user.nickname).toEqual('6f37a0beb7b16f37a0beb7b1b');
                expect(user.email).toEqual('test@ebi.ac.uk');
                // tslint:disable-next-line:max-line-length
                expect(user.token).toEqual('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3RzaS5lYmkuYWMudWsiLCJleHAiOjEwMDAwMDAwMDAwMDAsImp0aSI6InR6Wmo4Z29xUWVMRVBNakxIMDJwVEEiLCJpYXQiOjE1MTgwODMzNzMsInN1YiI6InVzci03NWY0YjAwMCIsImVtYWlsIjoidGVzdEBlYmkuYWMudWsiLCJuaWNrbmFtZSI6IjZmMzdhMGJlYjdiMTZmMzdhMGJlYjdiMWIiLCJuYW1lIjoiRWQgTXVuZGVuIEdyYXMiLCJkb21haW5zIjpbImFhcC11c2Vycy1kb21haW4iXX0.up6dm5r1KB0yunL5vlyHpf8citI1JqMKlhzdg0oEXII');
            }
        });
    });

    // It doesn't work because async and timer issues
    xit('must be able to log out', fakeAsync(() => {
            let isAuthenticated = false;
            service.user().subscribe(user => isAuthenticated = user != null);
            flushMicrotasks();
            expect(isAuthenticated).toBe(true, 'user must be authenticated at this point');

            // This doesn't work because the token is not coming from local storage but is a constant value.
            service.logOut();
            window.dispatchEvent(new Event('storage'));
            flushMicrotasks();
            expect(isAuthenticated).toBe(false, 'user must not be authenticated at this point');
        }));

    it('must create valid single-sign-on URL', () => {
        expect(service.getSSOURL({
                'ttl': '30',
                'o': '3'
            }))
            .toEqual('https://api.aai.ebi.ac.uk/sso?from=http%3A%2F%2Flocalhost%3A9876&ttl=30&o=3');
    });

    it('must limit the single-sign-on time-to-live argument to 1440 seconds', () => {
        expect(service.getSSOURL({
                'ttl': '1441',
                'o': '3'
            }))
            .toEqual('https://api.aai.ebi.ac.uk/sso?from=http%3A%2F%2Flocalhost%3A9876&ttl=1440&o=3');
    });
});

describe('AuthService with an expired token', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{
                    provide: JWT_OPTIONS,
                    useValue: {
                        tokenGetter: () => EXPIRED_TOKEN
                    }
                },
                JwtHelperService,
                TokenService,
                {
                    provide: AAP_CONFIG,
                    useValue: DEFAULT_CONF
                },
                AuthService
            ]
        });
    });

    it('must be created', inject([AuthService], (service: AuthService) => {
        expect(service).toBeTruthy();
    }));

    it('must provide null instead of a user', inject([AuthService], (service: AuthService) => {
        const users = service.user();
        users.subscribe(user => expect(user).toBeNull());
    }));

});
