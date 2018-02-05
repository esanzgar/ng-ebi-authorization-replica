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
    TokenService
} from './token.service';
import {
//    JwtModule,
    JwtHelperService
} from '@auth0/angular-jwt';

export let tokenName = 'id_token';

// export function getToken(): string | null {
//     return localStorage.getItem(tokenName) || null;
// }

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
        TokenService,
        JwtHelperService
    ]
})
export class AuthModule {}
