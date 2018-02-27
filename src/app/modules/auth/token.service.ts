import {
    Injectable
} from '@angular/core';

import {
    JwtHelperService
} from '@auth0/angular-jwt';

/**
 * The purpose of this very simple service is to interface between the
 * AuthService and the specific token manipulation routing of JwtHelperService.
 * In this way, if in the future we want to replace JwtHelperService by
 * another service, AuthService doesn't need to be modified, only this service.
 */
@Injectable()
export class TokenService {

    constructor(
        private _jwt: JwtHelperService
    ) {}

    public getToken(): string | null {
        return this._jwt.tokenGetter();
    }

    public getTokenExpirationDate(): Date | null {
        try {
            return this._jwt.getTokenExpirationDate();
        } catch (e) {
            return null;
        }
    }

    public isTokenValid(): boolean {
        try {
            return !this._jwt.isTokenExpired();
        } catch (error) {
            return false;
        }
    }

    /**
     * Get claims from the token.
     *
     * @param claim The name of the claim
     * @param defaultValue The default value returned in case of error
     *
     * @returns claim or default value
     */
    public getClaim < T, C > (claim: string, defaultValue: C): T | C {
        try {
            const value = < T > this._jwt.decodeToken()[claim];
            if (value === undefined) {
                return defaultValue;
            }
            return value;
        } catch (e) {
            return defaultValue;
        }
    }
}
