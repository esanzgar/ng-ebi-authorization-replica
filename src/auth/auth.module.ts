import {
    NgModule,
    Optional,
    SkipSelf,
    ModuleWithProviders,
} from '@angular/core';

import {
    JWT_OPTIONS,
    JwtHelperService
} from '@auth0/angular-jwt';
import {
    TokenService
} from './token.service';
import {
    AuthConfig,
    AAP_CONFIG,
    DEFAULT_CONF
} from './auth.config';
import {
    AuthService
} from './auth.service';

@NgModule({})
export class AuthModule {

    constructor(@Optional() @SkipSelf() parentModule: AuthModule) {
        if (parentModule) {
            throw new Error('AuthModule is already loaded. It should only be imported in your application\'s main module.');
        }
    }

    static forRoot(options?: AuthConfig): ModuleWithProviders {
        return {
            ngModule: AuthModule,
            providers: [
                TokenService,
                {
                    provide: AAP_CONFIG,
                    useValue: options ? options : DEFAULT_CONF
                },
                AuthService
            ]
        };
    }
}
