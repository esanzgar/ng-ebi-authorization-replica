import {
    BrowserModule
} from '@angular/platform-browser';
import {
    NgModule
} from '@angular/core';

// Modules
import {
    HttpClientModule
} from '@angular/common/http';
import {
    AuthModule
} from './modules/auth/auth.module';
import {
    JwtModule
} from '@auth0/angular-jwt';
import {
    ReactiveFormsModule
} from '@angular/forms';

import {
    environment
} from '../environments/environment';

// Components
import {
    AppComponent
} from './app.component';

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

const domain = environment.aapURL.replace('https://', '');

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        ReactiveFormsModule,
        AuthModule.forRoot({
            aapURL: environment.aapURL,
            tokenGetter: getToken,
            tokenUpdater: updateToken,
            //     tokenRemover: removeToken  // Optional
        }),
        JwtModule.forRoot({
            config: {
                tokenGetter: getToken,
                whitelistedDomains: [environment.aapDomain],
                blacklistedRoutes: [environment.loginAAP],
            }
        })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {}
