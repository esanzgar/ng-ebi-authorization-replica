import {
    TestBed,
    inject
} from '@angular/core/testing';

import {
    TokenService
} from './token.service';
import {
    JWT_OPTIONS,
    JwtHelperService
} from '@auth0/angular-jwt';
import {
    VALID_TOKEN_1,
    EXPIRED_TOKEN_1
} from 'testing/tokens';

describe('TokenService', () => {
    let service: TokenService;

    describe('with valid token', () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                providers: [{
                        provide: JWT_OPTIONS,
                        useValue: {
                            tokenGetter: () => VALID_TOKEN_1
                        }
                    },
                    JwtHelperService,
                    TokenService
                ]
            });
            service = TestBed.get(TokenService);
        });

        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('getToken should return valid token', () => {
            expect(service.getToken()).toBe(VALID_TOKEN_1);
        });

        it('token should be valid', () => {
            expect(service.isTokenValid()).toBe(true);
        });

        it('token should have correct expired date', () => {
            expect(service.getTokenExpirationDate()).toEqual(new Date(1000000000000000));
        });

        it('getClaim should return correct value', () => {
            expect(service.getClaim('iss', 'Dummy')).toBe('https://aai.ebi.ac.uk/sp');
        });

        it('getClaim should with non-existing claim should return default value "Dummy"', () => {
            expect(service.getClaim('issr', 'Dummy')).toBe('Dummy');
        });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toBeNull();
        });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toBeNull();
        });
    });

    describe('with expired token', () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                providers: [{
                        provide: JWT_OPTIONS,
                        useValue: {
                            tokenGetter: () => EXPIRED_TOKEN_1
                        }
                    },
                    JwtHelperService,
                    TokenService
                ]
            });
            service = TestBed.get(TokenService);
        });

        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('getToken should return expired token', () => {
            expect(service.getToken()).toBe(EXPIRED_TOKEN_1);
        });

        it('token should not be valid', () => {
            expect(service.isTokenValid()).toBe(false);
        });

        it('token should have correct expired date', () => {
            expect(service.getTokenExpirationDate()).toEqual(new Date(1518083433000));
        });

        it('getClaim should return correct value', () => {
            expect(service.getClaim('iss', 'Dummy')).toBe('https://aai.ebi.ac.uk/sp');
        });

        it('getClaim should with non-existing claim should return default value "Dummy"',
            () => {
                expect(service.getClaim('issr', 'Dummy')).toBe('Dummy');
            });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toBeNull();
        });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toBeNull();
        });
    });

    describe('with malformed token', () => {
        const malformedToken = 'asdfk.asdf.asdf';
        beforeEach(() => {
            TestBed.configureTestingModule({
                providers: [{
                        provide: JWT_OPTIONS,
                        useValue: {
                            tokenGetter: () => malformedToken
                        }
                    },
                    JwtHelperService,
                    TokenService
                ]
            });
            service = TestBed.get(TokenService);
        });

        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('getToken should return expired token', () => {
            expect(service.getToken()).toBe(malformedToken);
        });

        it('token should not be valid', () => {
            expect(service.isTokenValid()).toBe(false);
        });

        it('token should have correct expired date', () => {
            expect(service.getTokenExpirationDate()).toBeNull();
        });

        it('getClaim should return correct value', () => {
            expect(service.getClaim('iss', 'Dummy')).toBe('Dummy');
        });

        it('getClaim should with non-existing claim should return default value "Dummy"',
            () => {
                expect(service.getClaim('issr', 'Dummy')).toBe('Dummy');
            });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toBeNull();
        });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toBeNull();
        });
    });
});
