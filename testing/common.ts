import {
    NgModule
} from '@angular/core';

import {
    ReactiveFormsModule,
} from '@angular/forms';
import {
    HttpClientTestingModule,
} from '@angular/common/http/testing';

import {
    JwtModule
} from '@auth0/angular-jwt';
import {
    AuthModule
} from 'src/auth/auth.module';

export const tokenName = 'jwt_token';
export function getToken(): string {
    return localStorage.getItem(tokenName) || '';
}
export function updateToken(newToken: string): void {
    return localStorage.setItem(tokenName, newToken);
}
// Optional
export function removeToken(): void {
    return localStorage.removeItem(tokenName);
}
@NgModule({
    imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        AuthModule.forRoot({
            aapURL: 'https://blah.com',
            tokenGetter: getToken,
            tokenUpdater: updateToken,
            tokenRemover: removeToken // Optional
        }),
        JwtModule.forRoot({
            config: {
                tokenGetter: getToken,
                whitelistedDomains: ['blah.com'],
                blacklistedRoutes: ['https://blah.com/auth']
            }
        }),
    ],
    exports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        JwtModule,
        AuthModule,
    ],
})
export class CommonTestingModule {}
