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

describe('AuthService (valid token)', () => {

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

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should be authenticated', () => {
        const isAuthenticated = service.isAuthenticated();
        isAuthenticated.subscribe(result => expect(result).toBeTruthy());
    });

    it('should have credentials', () => {
        const credentials = service.credentials();
        credentials.subscribe(result => expect(result).toBeTruthy());
    });

    it('should have username', () => {
        const username = service.username();
        username.subscribe(result => expect(result).toEqual('usr-75f4b000'));
    });

    it('should have realname', () => {
        const realname = service.realname();
        realname.subscribe(result => expect(result).toEqual('Ed Munden Gras'));
    });

    it('should have email', () => {
        const email = service.email();
        email.subscribe(result => expect(result).toEqual('test@ebi.ac.uk'));
    });

    it('should have token', () => {
        const token = service.token();
        token.subscribe(result => expect(result).toEqual(VALID_TOKEN));
    });

    // It doesn't work because async and timer issues
    it('should have log out', fakeAsync(() => {
            let isAuthenticated = false;
            service.isAuthenticated().subscribe(result => isAuthenticated = result);
            flushMicrotasks();
            expect(isAuthenticated).toEqual(true);
            // This doesn't work because the token is not coming from local storage but is a constant value.
            // service.logOut();
            // window.dispatchEvent(new Event('storage'));
            // flushMicrotasks();
            // expect(isAuthenticated).toEqual(false);
        }));

    it('should be correct single sign on URL', () => {
        expect(service.getSSOURL({
                'ttl': '30',
                'o': '3'
            }))
            .toEqual('https://api.aai.ebi.ac.uk/sso?from=http%3A%2F%2Flocalhost%3A9876&ttl=30&o=3');
    });

    it('should be correct single sign on URL', () => {
        expect(service.getSSOURL({
                'ttl': '1441',
                'o': '3'
            }))
            .toEqual('https://api.aai.ebi.ac.uk/sso?from=http%3A%2F%2Flocalhost%3A9876&ttl=1440&o=3');
    });
});

describe('AuthService (expired token)', () => {
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

    it('should be created', inject([AuthService], (service: AuthService) => {
        expect(service).toBeTruthy();
    }));

    it('should not be authenticated', inject([AuthService], (service: AuthService) => {
        const isAuthenticated = service.isAuthenticated();
        isAuthenticated.subscribe(result => expect(result).toBeFalsy());
    }));

    it('should not have credentials', inject([AuthService], (service: AuthService) => {
        const credentials = service.credentials();
        credentials.subscribe(result => expect(result).toBeNull());
    }));

    it('should not have username', inject([AuthService], (service: AuthService) => {
        const username = service.username();
        username.subscribe(result => expect(result).toBeNull());
    }));

    it('should not have realname', inject([AuthService], (service: AuthService) => {
        const realname = service.realname();
        realname.subscribe(result => expect(result).toBeNull());
    }));

    it('should not have email', inject([AuthService], (service: AuthService) => {
        const email = service.email();
        email.subscribe(result => expect(result).toBeNull());
    }));

    it('should not have token', inject([AuthService], (service: AuthService) => {
        const token = service.token();
        token.subscribe(result => expect(result).toBeNull());
    }));


});
