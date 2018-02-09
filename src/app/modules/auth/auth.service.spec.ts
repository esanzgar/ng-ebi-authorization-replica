import {
    TestBed,
    inject
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

describe('AuthService', () => {
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

    it('should be created', inject([AuthService], (service: AuthService) => {
        expect(service).toBeTruthy();
    }));
});
