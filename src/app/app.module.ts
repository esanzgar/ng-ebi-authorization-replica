import {
    BrowserModule
} from '@angular/platform-browser';
import {
    NgModule
} from '@angular/core';

// Modules
import {
  environment
} from 'src/environments/environment';
import {
    AuthModule
} from './modules/auth/auth.module';
import {
    JwtModule
} from '@auth0/angular-jwt';

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

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AuthModule.forRoot({
            aapURL: environment.aapURL,
            tokenGetter: getToken,
            tokenUpdater: updateToken,
        //     tokenRemover: removeToken  // Optional
        }),
        JwtModule.forRoot({
            config: {
                tokenGetter: getToken,
                whitelistedDomains: []
            }
        })
    ],
    providers: [
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
