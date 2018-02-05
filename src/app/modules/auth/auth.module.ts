import {
    NgModule
} from '@angular/core';
import {
    CommonModule
} from '@angular/common';

import {
    AuthService
} from './auth.service';
import {
    //    JwtModule,
    JWT_OPTIONS,
    JwtHelperService
} from '@auth0/angular-jwt';

export let tokenName = 'id_token';

export function getToken(): string | null {
    return localStorage.getItem(tokenName);
}

@NgModule({
    imports: [
        CommonModule,
        //        JwtModule.forRoot({
        //            config: {
        //                tokenGetter: getToken,
        //                whitelistedDomains: []
        //            }
        //        })
    ],
    providers: [
        AuthService,
        {
            provide: JWT_OPTIONS,
            useValue: {
                tokenGetter: getToken,
            }
        },
        JwtHelperService
    ]
}) export class AuthModule {}
