import {
    Injectable,
    Inject,
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
    AAP_CONFIG,
    AuthConfig
} from './auth.config';
import {
    TokenService
} from './token.service';

export interface LoginOptions {
    [key: string]: string;
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
        private _tokenService: TokenService,
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
     * See method _filterLoginOptions regarding security risks of certain
     * LoginOptions.
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
     * See method _filterLoginOptions regarding security risks of certain
     * LoginOptions.
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
     * See method _filterLoginOptions regarding security risks of certain
     * LoginOptions.
     *
     * @param {LoginOptions} loginOptions Options passed as URL parameters to the SSO.
     *
     * @returnType { string } The SSO URL.
     *
     */
    public getSSOURL(options?: LoginOptions): string {
        let extra = '';
        if (options) {
            this._filterLoginOptions(options);
            extra = Object.keys(options)
                .map(key => [key, options[key]])
                .reduce((accumulator, keyvalue) => `${accumulator}&${keyvalue[0]}=${keyvalue[1]}`, '');
        }
        return `${this.aapURL}/sso?from=${this.domain}${extra}`;
    }

    /**
     * Filters options that are unsecure.
     *
     * See the advance options that can be requested through the options parameter:
     * https://api.aai.ebi.ac.uk/docs/authentication/authentication.index.html#_common_attributes
     *
     * The time to live paramenter (ttl) default value is 60 minutes. It is a
     * big security risk to request longer ttl. If a third party gets hold of
     * such token, means that they could use it for a day, week, year
     * (essentially, like having the username/password).
     *
     * @param {LoginOptions} loginOptions Options passed as URL parameters to the SSO.
     *
     * @returnType { void }
     *
     */
    public _filterLoginOptions(options: LoginOptions) {
        if (Object.keys(options).indexOf('ttl') > -1) {
            const ttl: number = +options['ttl'];
            const softLimit = 60;
            const hardLimit = 60 * 24;
            if (ttl > hardLimit) {
                window.console.error(`Login requested with an expiration longer than ${hardLimit} minutes! This is not allowed.`);
                window.console.error(`Expiration request reset to ${hardLimit} minutes.`);
                options['ttl'] = '' + hardLimit;
            } else if (ttl > softLimit) {
                window.console.warn(`Login requested with an expiration longer than ${softLimit} minutes!`);
            }
        }
    }

    /**
     * Functions that logs out the user.
     * It triggers the logout callbacks.
     * It is an arrow function (lambda) because in that way it has a reference
     * to 'this' when used in setTimeout call.
     */
    public logOut = () => {
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
            const expireDate = < Date > this._tokenService.getTokenExpirationDate();
            // Coercing dates to numbers with the unary operator '+'
            const delay = +expireDate - +new Date();
            this._timeoutID = window.setTimeout(this.logOut, delay);
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
        return this._tokenService.isTokenValid();
    }

    private _getToken(): string | null {
        return this._tokenService.getToken();
    }

    private _getUserName(): string | null {
        return this._tokenService.getClaim < string, null > ('email', null);
    }

    private _getRealName(): string | null {
        return this._tokenService.getClaim < string, null > ('name', null);
    }

}
