import {
    Injectable,
    Inject,
    RendererFactory2,
    Renderer2
} from '@angular/core';
import {
    Observable
} from 'rxjs/Observable';
import {
    BehaviorSubject,
} from 'rxjs/BehaviorSubject';
import {
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

export interface Credentials {
    realname: string;
    username: string;
    token: string;
}

@Injectable()
export class AuthService {

    private _credentials = new BehaviorSubject < Credentials | null > (null);

    private _loginCallbacks: Function[] = [];
    private _logoutCallbacks: Function[] = [];

    private _timeoutID: number | undefined = undefined;

    // Configuration
    readonly domain: string;
    readonly aapURL: string;
    readonly storageUpdater: (newToken: any) => void;
    readonly storageRemover: () => void;

    // This two properties are used for inter-window communcation.
    // It is achieve through the update of the dummy key storage 'commKeyName'
    readonly commKeyName = 'AngularAapAuthUpdated';
    readonly commKeyUpdater = () => localStorage.setItem(this.commKeyName, '' + new Date().getTime());

    constructor(
        private _rendererFactory: RendererFactory2,
        private _tokenService: TokenService,
        @Inject(AAP_CONFIG) private config: AuthConfig
    ) {
        this.domain = encodeURIComponent(window.location.origin);
        this.aapURL = config.aapURL.replace(/\/$/, '');
        this.storageUpdater = config.tokenUpdater;
        if (config.tokenRemover) {
            this.storageRemover = config.tokenRemover;
        } else {
            this.storageRemover = () => config.tokenUpdater(null);
        }

        const renderer = this._rendererFactory.createRenderer(null, null);
        this._listenLoginMessage(renderer);
        this._listenChangesFromOtherWindows(renderer);

        this._updateCredentials(); // TODO: experiment with setTimeOut
    }

    public isAuthenticated(): Observable < boolean > {
        return this._credentials.asObservable().pipe(
            map(credentials => credentials ? true : false)
        );
    }

    public credentials(): Observable < Credentials | null > {
        return this._credentials.asObservable();
    }

    public realname(): Observable < string | null > {
        return this._credentials.asObservable().pipe(
            map(credentials => credentials ?  credentials.realname : null)
        );
    }

    public username(): Observable < string | null > {
        return this._credentials.asObservable().pipe(
            map(credentials => credentials ?  credentials.username : null)
        );
    }

    public token(): Observable < string | null > {
        return this._credentials.asObservable().pipe(
            map(credentials => credentials ?  credentials.token : null)
        );
    }

    /**
     * Functions that opens a window instead of a tab.
     *
     * See method _filterLoginOptions regarding security risks of certain
     * LoginOptions.
     *
     * @param loginOptions Options passed as URL parameters to the SSO.
     * @param width Pixel width of the login window.
     * @param height Pixel height of the login window.
     * @param top Position of the top corners. If it is a negative
     *             number it centres the login window on the screen.
     * @param left Position of the left corners. If it is a negative
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
     * @param loginOptions Options passed as URL parameters to the SSO.
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
     * @param  loginOptions Options passed as URL parameters to the SSO.
     *
     * @returns The SSO URL.
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
     * @param  loginOptions Options passed as URL parameters to the SSO.
     *
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
    public logOut() {
        this.storageRemover();
        this._updateCredentials();

        // Triggers updating other windows
        this.commKeyUpdater();
    }

    /**
     * Add a callback to the LogIn event.
     *
     * @param callback The Function called when the login event is triggered and the
     *    JWT token is received and accepted.
     *
     * @returns The event registration id (necessary to unregister the event).
     */
    public addLogInEventListener(callback: Function): number {
        return this._loginCallbacks.push(callback);
    }

    /**
     * Remove a callback from the LogIn event.
     *
     * @param id The id given when event listener was added.
     *
     * @returns true when remove successfully, false otherwise.
     */
    public removeLogInEventListener(id: number): boolean {
        return delete this._loginCallbacks[id - 1];
    }

    /**
     * Add a callback to the LogOut event.
     *
     * @param callback The Function called when the logout event is triggered and the
     *    JWT token is received and accepted.
     *
     * @returns The registration id (necessary to unregister the event).
     */
    public addLogOutEventListener(callback: Function): number {
        return this._logoutCallbacks.push(callback);
    }

    /**
     * Remove a callback from the LogOut event.
     *
     * @param id The id given when event listener was added.
     *
     * @returns true when remove successfully, false otherwise.
     */
    public removeLogOutEventListener(id: number): boolean {
        return delete this._logoutCallbacks[id - 1];
    }

    /**
     * Listen for login messages from other windows.
     * These messages contain the tokens from the AAP.
     * If a token is received then the callbacks are triggered.
     */
    private _listenLoginMessage(renderer: Renderer2) {
        renderer.listen('window', 'message', (event: MessageEvent) => {
            if (!this.messageIsAcceptable(event)) {
                return;
            }
            this.storageUpdater(event.data);
            event.source.close();
            this._updateCredentials();

            // Triggers updating other windows
            this.commKeyUpdater();
        });
    }

    /** Listen to changes in the token from *other* windows.
     *
     * For inter-window communication messages are transmitted trough changes
     * on a dummy storage key property: 'commKeyName'.
     *
     * Notice that changes in the 'commKeyName' produced by this class doesn't
     * trigger this event.
     */
    private _listenChangesFromOtherWindows(renderer: Renderer2) {
        renderer.listen('window', 'storage', (event: StorageEvent) => {
            if (event.key === this.commKeyName) {
                this._updateCredentials();
            }
        });
    }

    /**
     * Check if the message is coming from the same domain we use to generate
     * the SSO URL, otherwise it's iffy and shouldn't trust it.
     */
    private messageIsAcceptable(event: MessageEvent): boolean {
        return event.origin === this.aapURL;
    }

    private _updateCredentials() {
        const isAuthenticated = this._loggedIn();

        if (this._timeoutID) {
            window.clearTimeout(this._timeoutID);
        }

        if (isAuthenticated) {
            this._credentials.next({
                realname: < string > this._getRealName(),
                username: < string > this._getUserName(),
                token: < string > this._getToken()
            });

            this._loginCallbacks.map(callback => callback && callback());

            // Schedule future logout event base on token expiration
            const expireDate = < Date > this._tokenService.getTokenExpirationDate();
            // Coercing dates to numbers with the unary operator '+'
            const delay = +expireDate - +new Date();
            this._timeoutID = window.setTimeout(() => this.logOut(), delay);
        } else {
            this.storageRemover(); // Cleanup possible left behind token
            this._credentials.next(null);
            this._logoutCallbacks.map(callback => callback && callback());
        }
    }

    /**
     * Check if there's a user logging on and whether the token is still valid.
     *
     * @returns  Whether the user user is authenticated or not.
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
