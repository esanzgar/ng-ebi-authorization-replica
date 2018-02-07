import {
    Injectable,
    Inject,
    RendererFactory2
} from '@angular/core';
import {
    Observable
} from 'rxjs/observable';
import {
    BehaviorSubject,
} from 'rxjs/behaviorsubject';
import {
    filter,
    map
} from 'rxjs/operators';

import {
    AAP_CONFIG,
    AuthConfig
} from './auth.config';
import {
    JwtHelperService
} from '@auth0/angular-jwt';

interface LoginOptions {
    [key: string]: string
}

@Injectable()
export class AuthService {

    private _realname = new BehaviorSubject < string | null > (null);
    private _realname$ = this._realname.asObservable();

    private _username = new BehaviorSubject < string | null > (null);
    private _username$ = this._username.asObservable();

    private _token = new BehaviorSubject < string | null > (null);
    private _token$ = this._token.asObservable();

    private _isAuthenticated = new BehaviorSubject < boolean > (false);
    private _isAuthenticated$ = this._isAuthenticated.asObservable();

    private _loginCallbacks: Function[] = [];
    private _logoutCallbacks: Function[] = [];

    private _timeoutID: number;

    // Configuration
    readonly domain: string;
    readonly aapURL: string;
    readonly storageUpdater: (newToken: any) => void;
    readonly storageRemover: () => void;

    constructor(
        private _rendererFactory: RendererFactory2,
        private _jwt: JwtHelperService,
        @Inject(AAP_CONFIG) private config: AuthConfig
    ) {
        this.domain = encodeURIComponent(window.location.origin);
        this.aapURL = config.aapURL;
        this.storageRemover = config.tokenRemover;
        this.storageUpdater = config.tokenUpdater;

        this._listenLoginMessage();
        this._updateCredentials();
    }

    public isAuthenticated(): Observable < boolean > {
        return this._isAuthenticated$;
    }

    public realname(): Observable < string | null > {
        return this._realname$;
    }

    public username(): Observable < string | null > {
        return this._username$;
    }

    public token(): Observable < string | null > {
        return this._token$;
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
    public windowOpen(loginOptions?: LoginOptions, width = 650, height = 1000, top = -1, left = -1) {
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
    public tabOpen(loginOptions?: LoginOptions) {
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
    public getSSOURL(options?: LoginOptions): string {
        let extra = '';
        if (options) {
            extra = Object.entries(options).reduce((accumulator, keyvalue) => `${accumulator}&${keyvalue[0]}=${keyvalue[1]}`, '');
        }
        return `${this.aapURL}/sso?from=${this.domain}${extra}`;
    }

    /**
     * Functions that logs out the user.
     * It triggers the logout callbacks.
     */
    public logOut(): void {
        this.storageRemover();
        this._updateCredentials();
        this._logoutCallbacks.map(callback => callback && callback());
        if (this._timeoutID) {
            window.clearTimeout(this._timeoutID);
        }
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
     * Listen for login messages from other windows.
     * These messages contain the tokens from the AAP.
     * If a token is received then the callbacks are triggered.
     *
     * @param {Function} callback The Function called when the event with the
     *    JWT token is received and accepted as valid.
     */
    private _listenLoginMessage() {
        const renderer = this._rendererFactory.createRenderer(null, null);
        renderer.listen('window', 'message', (event: MessageEvent) => {
            if (!this.messageIsAcceptable(event)) {
                return;
            }
            this.storageUpdater(event.data);
            event.source.close();
            this._updateCredentials();

        });
    }

    /**
     * Check if the message is coming from the same domain we use to generate
     * the SSO URL, otherwise it's iffy and shouldn't trust it.
     */
    private messageIsAcceptable(event: MessageEvent): boolean {
        const expectedURL: string = this.aapURL.replace(/\/$/, '');
        return event.origin === expectedURL;
    }

    private _updateCredentials() {
        const isAuthenticated = this._loggedIn();
        this._isAuthenticated.next(isAuthenticated);

        if (isAuthenticated) {
            this._username.next(this._getUserName());
            this._realname.next(this._getRealName());
            this._token.next(this._getToken());

            this._loginCallbacks.map(callback => callback && callback());

            // Schedule future logout event base on token expiration
            if (this._timeoutID) {
                window.clearTimeout(this._timeoutID);
            }
            // Coercing dates to numbers with the unary operator '+'
            const delay = +this._jwt.getTokenExpirationDate() - +new Date();
            this._timeoutID = window.setTimeout(this.logOut.bind(this), delay);
        } else {
            this._username.next(null);
            this._realname.next(null);
            this._token.next(null);
        }
    }

    /**
     * Check if there's a user logging on and whether the token is still valid.
     * @returnType { boolean } Whether the application is able to send
     * authenticated requests or not.
     */
    private _loggedIn(): boolean {
        try {
            return !this._jwt.isTokenExpired();
        } catch (error) {
            return false
        }
    }

    private _getUserName(): string | null {
        return this._getClaim < string, null > ('email', null);
    }

    private _getRealName(): string | null {
        return this._getClaim < string, null > ('name', null);
    }

    private _getToken(): string | null {
        return this._jwt.tokenGetter();
    }

    /**
     * Get claims from the token.
     *
     * @param {string} The name of the claim
     * @param {any} The default value in case of error
     *
     * @returnType { any } Claim
     */
    private _getClaim < T, C > (claim: string, defaultValue: C): T | C {
        try {
            return <T > this._jwt.decodeToken()[claim];
        } catch (e) {
            return defaultValue;
        }
    }
}
