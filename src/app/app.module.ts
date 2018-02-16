import {
    BrowserModule
} from '@angular/platform-browser';
import {
    NgModule
} from '@angular/core';

import {
    AppComponent
} from './app.component';
import {
    AuthModule
} from './modules/auth/auth.module';

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
        // AuthModule.forRoot(),
        AuthModule.forRoot({
            aapURL: 'https://api.aai.ebi.ac.uk',
            tokenGetter: getToken,
            tokenUpdater: updateToken,
        //     tokenRemover: removeToken  // Optional
        }),
        // JwtModule.forRoot({
        //     config: {
        //         tokenGetter: getToken,
        //         whitelistedDomains: []
        //     }
        // })
    ],
    providers: [
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
