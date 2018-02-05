import {
    Injectable
} from '@angular/core';

import {
    JwtHelperService
} from '@auth0/angular-jwt';

let tokenName = 'id_token';

@Injectable()
export class TokenService {

    constructor(
        private jwter: JwtHelperService
    ) {}

    public getToken(): string{
        return localStorage.getItem(tokenName) || '';
    }

    public saveToken(jwt: string) {
        localStorage.setItem(tokenName, jwt);
    }

    public removeToken() {
        localStorage.removeItem(tokenName);
    }

    // public getEmail(): string {
    //     return this.getClaim('email');
    // }

    // public getName(): string {
    //     return this.getClaim('name');
    // }

    public getExpiration(): Date | undefined{
        return this.jwter.getTokenExpirationDate(this.getToken());
    }

    public isTokenExpired(): boolean {
        return this.jwter.isTokenExpired(this.getToken());
    }

    // private getClaim(claim: string): string {
    //     return this.processToken(
    //         (token: string) => this.jwter.decodeToken(token)[claim],
    //         '');
    // }

    public getClaim<T, C>(claim:string, defaultValue: C): T|C{
        const token = this.getToken();
        try {
            return <T>this.jwter.decodeToken(token)[claim];
        } catch (e) {
            return defaultValue;
        }
    }

    // /**
    //  * Try to get some information from the token, if it fails return a default value.
    //  *
    //  * @param {process} function to apply to the token
    //  * @param {defaultValue} default value to return if something goes wrong while applying the function.
    //  * @returnType { T } the type that the function returns and the default value.
    //  */
    // private processToken < T > (process: (token: string) => T, defaultValue: T): T {
    //     const token = this.getToken();
    //     try {
    //         return process(token);
    //     } catch (e) {
    //         return defaultValue;
    //     }
    // }
}
