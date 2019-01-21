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
            expect(service.getToken()).toEqual(VALID_TOKEN_1);
        });

        it('token should be valid', () => {
            expect(service.isTokenValid()).toEqual(true);
        });

        it('token should have correct expired date', () => {
            expect(service.getTokenExpirationDate()).toEqual(new Date(1000000000000000));
        });

        it('getClaim should return correct value', () => {
            expect(service.getClaim('iss', 'Dummy')).toEqual('https://aai.ebi.ac.uk/sp');
        });

        it('getClaim should with non-existing claim should return default value "Dummy"', () => {
            expect(service.getClaim('issr', 'Dummy')).toEqual('Dummy');
        });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toEqual(null);
        });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toEqual(null);
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
            expect(service.getToken()).toEqual(EXPIRED_TOKEN_1);
        });

        it('token should not be valid', () => {
            expect(service.isTokenValid()).toEqual(false);
        });

        it('token should have correct expired date', () => {
            expect(service.getTokenExpirationDate()).toEqual(new Date(1518083433000));
        });

        it('getClaim should return correct value', () => {
            expect(service.getClaim('iss', 'Dummy')).toEqual('https://aai.ebi.ac.uk/sp');
        });

        it('getClaim should with non-existing claim should return default value "Dummy"',
            () => {
                expect(service.getClaim('issr', 'Dummy')).toEqual('Dummy');
            });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toEqual(null);
        });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toEqual(null);
        });
    });

    describe('with malformed token)', () => {
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
            expect(service.getToken()).toEqual(malformedToken);
        });

        it('token should not be valid', () => {
            expect(service.isTokenValid()).toEqual(false);
        });

        it('token should have correct expired date', () => {
            expect(service.getTokenExpirationDate()).toEqual(null);
        });

        it('getClaim should return correct value', () => {
            expect(service.getClaim('iss', 'Dummy')).toEqual('Dummy');
        });

        it('getClaim should with non-existing claim should return default value "Dummy"',
            () => {
                expect(service.getClaim('issr', 'Dummy')).toEqual('Dummy');
            });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toEqual(null);
        });

        it('getClaim should with non-existing claim should return default value null', () => {
            expect(service.getClaim('issr', null)).toEqual(null);
        });
    });
});
