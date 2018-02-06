import {
    Injectable,
    RendererFactory2
} from '@angular/core';
import {
    Observable
} from 'rxjs/Observable';
import {
    BehaviorSubject,
} from 'rxjs/BehaviorSubject';
import {
    filter,
    map
} from 'rxjs/operators';

import {
    JwtHelperService
} from '@auth0/angular-jwt';

// TODO: remove dependency
let tokenName = 'id_token';
let authURL = 'https://api.aai.ebi.ac.uk';

export interface Credentials {
    realname: string | null;
    username: string | null;
    token: string | null;
    expiration: Date | null;
}

interface LoginOptions {
    [key: string]: string
}

@Injectable()
export class AuthService {

    static emptyCredentials: Credentials = {
        realname: null,
        username: null,
        token: null,
        expiration: null
    }

    private _credentials = new BehaviorSubject < Credentials > (AuthService.emptyCredentials);
    public credentials$ = this._credentials.asObservable();

    public realname$ = this.credentials$.pipe(map(credentials => credentials.realname));
    public username$ = this.credentials$.pipe(map(credentials => credentials.username));
    public token$ = this.credentials$.pipe(map(credentials => credentials.token));
    public expiration$ = this.credentials$.pipe(map(credentials => credentials.expiration));

    private _isAuthenticated = new BehaviorSubject < boolean > (false);
    public isAuthenticated$ = this._isAuthenticated.asObservable();

    private _loginCallbacks: Function[] = [];
    private _logoutCallbacks: Function[] = [];
    private _timeoutID: number;
    readonly domain: string;

    constructor(
        private rendererFactory: RendererFactory2,
        private jwt: JwtHelperService
        // @Inject('AAP_CONFIG') private environment: AuthConfig,
    ) {
        this.domain = encodeURIComponent(window.location.origin);

        /**
         * Listen for login messages from other windows and firing the callbacks.
         * These messages contain the tokens from the AAP.
         *
         * @param {Function} callback The Function called when the event with the
         *    JWT token is received and accepted as valid.
         */
        const renderer = rendererFactory.createRenderer(null, null);
        renderer.listen('window', 'message', (event: MessageEvent) => {
            if (!this.messageIsAcceptable(event)) {
                return;
            }
            localStorage.setItem(tokenName, event.data);
            event.source.close();
            this._updateCredentials();

        });

        this._updateCredentials();
    }

    private _updateCredentials() {
        const isAuthenticated = this.loggedIn();
        if (isAuthenticated) {
            this._credentials.next(this._getCredentials());
            this._isAuthenticated.next(isAuthenticated);

            this._loginCallbacks.map(callback => callback && callback());

            // Schedule future logout event base on token expiration
            if (this._timeoutID) {
                window.clearTimeout(this._timeoutID);
            }
            // coercing dates to numbers with the unary operator '+'
            const delay = + < Date > this.jwt.getTokenExpirationDate() - +new Date();
            this._timeoutID = window.setTimeout(this.logOut.bind(this), delay);
        } else {
            this._isAuthenticated.next(isAuthenticated);
            this._credentials.next(AuthService.emptyCredentials);
        }
    }

    /**
     * Check if there's a user logging on and whether the token is still valid.
     * @returnType { boolean } Whether the application is able to send
     * authenticated requests or not.
     */
    public loggedIn(): boolean {
        try {
            return !this.jwt.isTokenExpired();
        } catch (error) {
            return false
        }
    }

    private _getCredentials(): Credentials {
        return {
            realname: this.getName(),
            username: this.getUserName(),
            token: this.getToken(),
            expiration: this.getExpiration()
        };
    }

    public getUserName(): string | null {
        return this.getClaim < string, null > ('email', null);
    }

    public getName(): string | null {
        return this.getClaim < string, null > ('name', null);
    }

    public getToken(): string | null {
        return this.jwt.tokenGetter();
    }

    public getExpiration(): Date | null {
        return this.jwt.getTokenExpirationDate();
    }

    public logOut(): void {
        localStorage.removeItem(tokenName);
        this._updateCredentials();
        this._logoutCallbacks.map(callback => callback && callback());
        if (this._timeoutID) {
            window.clearTimeout(this._timeoutID);
        }
    }


    /**
     * Functions that opens a window instead of a tab.
     *
     * @param {LoginOptions} loginOptions Options passed as URL parameters to the SSO.
     * @param {number} width Pixel width of the login window.
     * @param {number} height Pixel height of the login window.
     * @param {number} top Position of the top corners. If it is a negative
     *             number it centres the login window on the screen.
     * @param {number} left Position of the left corners. If it is a negative
     *             number it centres the login window on the screen.
     */
    public windowOpen(loginOptions ? : LoginOptions, width = 650, height = 1000, top = -1, left = -1) {
        if (left < 0) {
            const screenWidth = screen.width;
            if (screenWidth > width) {
                left = Math.round(screenWidth / 2 - width / 2);
            }
        }
        if (top < 0) {
            const screenHeight = screen.height;
            if (screenHeight > height) {
                top = Math.round(screenHeight / 2 - height / 2);
            }
        }

        const windowOptions = [
            `width=${width}`,
            `height=${height}`,
            `left=${left}`,
            `top=${top}`,
            'personalbar=no',
            'toolbar=no',
            'scrollbars=yes',
            'resizable=yes',
            'directories=no',
            'location=no',
            'menubar=no',
            'titlebar=no',
            'toolbar=no'
        ];

        const loginWindow = window.open(this.getSSOURL(loginOptions), 'Sign in to Elixir', windowOptions.join(','));
        if (loginWindow) {
            loginWindow.focus();
        }
    }

    /**
     * Functions that opens a tab (in modern browser).
     *
     * @param {LoginOptions} loginOptions Options passed as URL parameters to the SSO.
     */
    public tabOpen(loginOptions ? : LoginOptions) {
        const loginWindow = window.open(this.getSSOURL(loginOptions), 'Sign in to Elixir');
        if (loginWindow) {
            loginWindow.focus();
        }
    }

    /**
     * Produces a URL that allows logging into the single sign on (SSO) page.
     * The URL cans be opened in a new tab using target="_blank",
     * or in a new window using window.open().
     *
     * @returnType { string } The SSO URL.
     *
     */
    public getSSOURL(options ? : LoginOptions): string {
        let extra = '';
        if (options) {
            extra = Object.entries(options).reduce((accumulator, keyvalue) => `${accumulator}&${keyvalue[0]}=${keyvalue[1]}`, '');
        }
        return `${authURL}/sso?from=${this.domain}${extra}`;
    }

    /**
     * Add a callback to the LogIn event.
     *
     * @param {Function} callback The Function called when the login event is triggered and the
     *    JWT token is received and accepted.
     *
     * @returnType { number } The event registration id (necessary to unregister the event).
     */
    public addLogInEventListener(callback: Function): number {
        return this._loginCallbacks.push(callback);
    }

    /**
     * Remove a callback from the LogIn event.
     *
     * @param {number} The id given when event listener was added.
     *
     * @returnType { boolean } true when remove successfully, false otherwise.
     */
    public removeLogInEventListener(index: number): boolean {
        return delete this._loginCallbacks[index - 1];
    }

    /**
     * Add a callback to the LogOut event.
     *
     * @param {Function} callback The Function called when the logout event is triggered and the
     *    JWT token is received and accepted.
     *
     * @returnType { number } The registration id (necessary to unregister the event).
     */
    public addLogOutEventListener(callback: Function): number {
        return this._logoutCallbacks.push(callback);
    }

    /**
     * Remove a callback from the LogOut event.
     *
     * @param {number} The id given when event listener was added.
     *
     * @returnType { boolean } true when remove successfully, false otherwise.
     */
    public removeLogOutEventListener(index: number): boolean {
        return delete this._logoutCallbacks[index - 1];
    }


    /**
     * Check if the message is coming from the same domain we use to generate
     * the SSO URL, otherwise it's iffy and shouldn't trust it.
     */
    private messageIsAcceptable(event: MessageEvent): boolean {
        const expectedURL: string = authURL.replace(/\/$/, '');
        return event.origin === expectedURL;
    }

    /**
     * Get claims from the token.
     *
     * @param {string} The name of the claim
     * @param {any} The default value in case of error
     *
     * @returnType { any } Claim
     */
    public getClaim<T, C>(claim:string, defaultValue: C): T|C{
        try {
            return <T>this.jwt.decodeToken()[claim];
        } catch (e) {
            return defaultValue;
        }
    }
}
