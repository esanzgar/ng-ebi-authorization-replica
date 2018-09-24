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
    VALID_TOKEN,
    EXPIRED_TOKEN
} from 'testing/tokens';

describe('TokenService (valid token)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{
                    provide: JWT_OPTIONS,
                    useValue: {
                        tokenGetter: () => VALID_TOKEN
                    }
                },
                JwtHelperService,
                TokenService
            ]
        });
    });

    it('should be created', inject([TokenService], (service: TokenService) => {
        expect(service).toBeTruthy();
    }));

    it('getToken should return valid token', inject([TokenService], (service: TokenService) => {
        expect(service.getToken()).toBe(VALID_TOKEN);
    }));

    it('token should be valid', inject([TokenService], (service: TokenService) => {
        expect(service.isTokenValid()).toBeTruthy();
    }));

    it('token should have correct expired date', inject([TokenService], (service: TokenService) => {
        expect(service.getTokenExpirationDate()).toEqual(new Date(1000000000000000));
    }));

    it('getClaim should return correct value', inject([TokenService], (service: TokenService) => {
        expect(service.getClaim('iss', 'Dummy')).toBe('https://tsi.ebi.ac.uk');
    }));

    it('getClaim should with non-existing claim should return default value "Dummy"', inject([TokenService], (service: TokenService) => {
        expect(service.getClaim('issr', 'Dummy')).toEqual('Dummy');
    }));

    it('getClaim should with non-existing claim should return default value null', inject([TokenService], (service: TokenService) => {
        expect(service.getClaim('issr', null)).toEqual(null);
    }));

    it('getClaim should with non-existing claim should return default value null', inject([TokenService], (service: TokenService) => {
        expect(service.getClaim('issr', null)).toEqual(null);
    }));
});

describe('TokenService (expired token)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{
                    provide: JWT_OPTIONS,
                    useValue: {
                        tokenGetter: () => EXPIRED_TOKEN
                    }
                },
                JwtHelperService,
                TokenService
            ]
        });
    });

    it('should be created', inject([TokenService], (service: TokenService) => {
        expect(service).toBeTruthy();
    }));

    it('getToken should return expired token', inject([TokenService], (service: TokenService) => {
        expect(service.getToken()).toBe(EXPIRED_TOKEN);
    }));

    it('token should not be valid', inject([TokenService], (service: TokenService) => {
        expect(service.isTokenValid()).toBeFalsy();
    }));

    it('token should have correct expired date', inject([TokenService], (service: TokenService) => {
        expect(service.getTokenExpirationDate()).toEqual(new Date(1518083433000));
    }));

    it('getClaim should return correct value', inject([TokenService], (service: TokenService) => {
        expect(service.getClaim('iss', 'Dummy')).toBe('https://tsi.ebi.ac.uk');
    }));

    it('getClaim should with non-existing claim should return default value "Dummy"', inject([TokenService], (service: TokenService) => {
        expect(service.getClaim('issr', 'Dummy')).toEqual('Dummy');
    }));

    it('getClaim should with non-existing claim should return default value null', inject([TokenService], (service: TokenService) => {
        expect(service.getClaim('issr', null)).toEqual(null);
    }));

    it('getClaim should with non-existing claim should return default value null', inject([TokenService], (service: TokenService) => {
        expect(service.getClaim('issr', null)).toEqual(null);
    }));
});
