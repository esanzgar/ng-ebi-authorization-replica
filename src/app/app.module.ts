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
    const token = localStorage.getItem('id_token');
    if (token === null){
        throw Error('Unable to access localStorage token');
    }
    return token;
}
export function removeToken(): void {
    return localStorage.removeItem('id_token');
}
export function updateToken(newToken: string): void {
    return localStorage.setItem('id_token', newToken);
}

@NgModule({
    declarations: [
        AppComponent
    ],

    imports: [
        BrowserModule,
        // AuthModule
        AuthModule.forRoot({
            aapURL: 'test',
            tokenRemover: removeToken,
            tokenUpdater: updateToken,
            config: {
                tokenGetter: getToken,
            }
        })
    ],
    providers: [
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
