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
} from 'app/../../testing/tokens';

describe('TokenService', () => {
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
});
