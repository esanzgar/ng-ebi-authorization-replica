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
} from 'src/app/modules/auth/auth.module';

export const jwt_token = 'test';
export function getToken(): string {
    return localStorage.getItem('jwt_token') || '';
}
export function updateToken(newToken: string): void {
    return localStorage.setItem('jwt_token', newToken);
}
// Optional
export function removeToken(): void {
    return localStorage.removeItem('jwt_token');
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
                whitelistedDomains: ['blah.com']
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
