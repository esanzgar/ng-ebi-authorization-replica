import {
    Injectable,
    Inject,
    OnDestroy,
    RendererFactory2,
    Renderer2
} from '@angular/core';
import {
    HttpClient,
    HttpHeaders,
    HttpResponse
} from '@angular/common/http';
import {
    Observable
} from 'rxjs';
import {
    BehaviorSubject,
} from 'rxjs';
import {
    filter,
    map,
    tap
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

export interface User {
    uid: string;
    name: string;
    nickname: string;
    email: string;
    token: string;
}

@Injectable()
export class AuthService implements OnDestroy {

    private _user = new BehaviorSubject < User | null > (null);

    private _loginCallbacks: Function[] = [];
    private _logoutCallbacks: Function[] = [];

    private _unlistenLoginMessage: Function;
    private _unlistenChangesFromOtherWindows: Function;

    private _timeoutID: number | null = null;

    // Configuration
    private readonly _domain: string;
    private readonly _appURL: string;
    private readonly _tokenURL: string;
    private readonly _authURL: string;
    private readonly _storageUpdater: (newToken: any) => void;
    private readonly _storageRemover: () => void;

    // This two properties are used for inter-window communication.
    // It is achieve through the update of the dummy key storage '_commKeyName'
    private readonly _commKeyName = 'AngularAapAuthUpdated';
    private readonly _commKeyUpdater = () => localStorage.setItem(this._commKeyName, '' + new Date().getTime());

    constructor(
        private _rendererFactory: RendererFactory2,
        private _tokenService: TokenService,
        private _http: HttpClient,
        @Inject(AAP_CONFIG) private config: AuthConfig
    ) {
        this._domain = encodeURIComponent(window.location.origin);

        this._appURL = config.aapURL.replace(/\/$/, '');
        this._authURL = `${this._appURL}/auth`;
        this._tokenURL = `${this._appURL}/token`;

        this._storageUpdater = config.tokenUpdater;
        if (config.tokenRemover) {
            this._storageRemover = config.tokenRemover;
        } else {
            this._storageRemover = () => config.tokenUpdater(null);
        }

        const renderer = this._rendererFactory.createRenderer(null, null);
        this._unlistenLoginMessage = this._listenLoginMessage(renderer);
        this._unlistenChangesFromOtherWindows = this._listenChangesFromOtherWindows(renderer);

        this._updateUser(); // TODO: experiment with setTimeOut
    }

    public ngOnDestroy() {
        this._unlistenLoginMessage();
        this._unlistenChangesFromOtherWindows();
    }

    public user(): Observable < User | null > {
        return this._user.asObservable();
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
    public openLoginWindow(options?: LoginOptions, width = 650, height = 1000, left = -1, top = -1) {
        if (left < 0) {
            const screenWidth = screen.width;
            if (screenWidth > width) {
                left = Math.round((screenWidth - width) / 2);
            }
        }
        if (top < 0) {
            const screenHeight = screen.height;
            if (screenHeight > height) {
                top = Math.round((screenHeight - height) / 2);
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

        const loginWindow = window.open(this.getSSOURL(options), 'Sign in to Elixir', windowOptions.join(','));
        if (loginWindow) {
            loginWindow.focus();
        }
    }

    /**
     * @deprecated use openLoginWindow method instead (top and left arguments are inverted in the new method)
     * since version 1.0.0-beta.5.
     * windowOpen will be deleted in version 1.0.0
     */
    public windowOpen(options?: LoginOptions, width = 650, height = 1000, top = -1, left = -1) {
        this._deprecationWarning('windowOpen', 'openLoginWindow');
        this.openLoginWindow(options, width, height, left, top);
    }

    /**
     * Functions that opens a tab (in modern browser).
     *
     * See method _filterLoginOptions regarding security risks of certain
     * LoginOptions.
     *
     * @param loginOptions Options passed as URL parameters to the SSO.
     */
    public openLoginTab(options?: LoginOptions) {
        const loginWindow = window.open(this.getSSOURL(options), 'Sign in to Elixir');
        if (loginWindow) {
            loginWindow.focus();
        }
    }

    /**
     * @deprecated use openLoginTab method instead
     * since version 1.0.0-beta.5.
     * tabOpen will be deleted in version 1.0.0
     */
    public tabOpen(options?: LoginOptions) {
        this._deprecationWarning('tabOpen', 'openLoginTab');
        this.openLoginTab(options);
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
        const fragments = this._formatFragments({
            'from': this._domain,
            ...options
        });
        return `${this._appURL}/sso${fragments}`;
    }

    /**
     * Functions that logs out the user.
     * It triggers the logout callbacks.
     * It is an arrow function (lambda) because in that way it has a reference
     * to 'this' when used in setTimeout call.
     */
    public logOut() {
        this._storageRemover();
        this._updateUser();

        // Triggers updating other windows
        this._commKeyUpdater();
    }

    /**
     * Create AAP account
     *
     * @returns uid of the new user
     */
    public createAAPaccount(newUser: {
        name?: string,
        username: string,
        password: string,
        email?: string,
        organization?: string
    }): Observable < string > {
        return this._http.post(this._authURL, newUser, {
            responseType: 'text'
        });
    }

    /**
     * Login directly through the AAP
     *
     * See method _filterLoginOptions regarding security risks of certain
     * LoginOptions.
     *
     * @returns true if the user successfully login, otherwise false
     */
    public loginAAP(
        user: {
            username: string,
            password: string,
        }, options?: LoginOptions
    ): Observable < boolean > {
        const fragments = this._formatFragments(options);
        return this._http.get(`${this._authURL}${fragments}`, {
            headers: this._createAuthHeader(user),
            responseType: 'text'
        }).pipe(
            tap(token => {
                this._storageRemover();
                this._storageUpdater(token);
                this._updateUser();

                // Triggers updating other windows
                this._commKeyUpdater();
            }),
            map(Boolean),
        );
    }

    /**
     * Change password AAP account
     *
     * @returns true when password is successfully changed
     */
    public changePasswordAAP({
        username,
        oldPassword,
        newPassword
    }: {
        username: string,
        oldPassword: string,
        newPassword: string,
    }): Observable < boolean > {
        return this._http.patch(this._authURL, {
            username,
            password: newPassword
        }, {
            headers: this._createAuthHeader({
                username,
                password: oldPassword
            })
        }).pipe(
            map(response => true) // response is empty, but if it reaches this point the request has successfully completed
        );
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
     * Refresh token
     *
     * @returns true when token is successfully refreshed
     */
    public refresh(): Observable < boolean > {
        return this._http.get(this._tokenURL, {
            responseType: 'text'
        }).pipe(
            tap(token => {
                this._storageRemover();
                this._storageUpdater(token);
                this._updateUser(false);

                // Triggers updating other windows
                this._commKeyUpdater();
            }),
            map(Boolean)
        );
    }

    /**
     * Format and filter fragment options
     *
     * @params options
     *
     * @returns fragment string
     */
    private _formatFragments(options?: LoginOptions) {
        if (options) {
            this._filterLoginOptions(options);
            return '?' + Object.entries(options)
                .map(([key, value]) => `${key}=${value}`).join('&');
        }

        return '';
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
    private _filterLoginOptions(options: LoginOptions) {
        if (Object.keys(options).indexOf('ttl') > -1) {
            const ttl: number = +options['ttl'];
            const softLimit = 60;
            const hardLimit = 60 * 24;
            if (ttl > hardLimit) {
                throw (new Error(`Login requested with an expiration longer than ${hardLimit} minutes! This is not allowed.`));
            }
            if (ttl > softLimit) {
                window.console.warn(`Login requested with an expiration longer than ${softLimit} minutes!`);
            }
        }
    }

    /**
     * Creates Authorization header
     *
     * @param object with username and password.
     *
     * @returns New authorization header
     */
    private _createAuthHeader({
        username,
        password
    }: {
        username: string,
        password: string,
    }) {
        const authToken = btoa(`${username}:${password}`);
        return new HttpHeaders({
            'Authorization': `Basic ${authToken}`
        });
    }

    /**
     * Listen for login messages from other windows.
     * These messages contain the tokens from the AAP.
     * If a token is received then the callbacks are triggered.
     */
    private _listenLoginMessage(renderer: Renderer2): Function {
        return renderer.listen('window', 'message', (event: MessageEvent) => {
            if (!this._messageIsAcceptable(event)) {
                return;
            }
            this._storageUpdater(event.data);

            // I don't know how to type guard event.source
            // This doesn't work
            // if (event.source instanceof Window) {
            if (event.source) {
                (event.source as Window).close();
            }

            this._updateUser();

            // Triggers updating other windows
            this._commKeyUpdater();
        });
    }

    /** Listen to changes in the token from *other* windows.
     *
     * For inter-window communication messages are transmitted trough changes
     * on a dummy storage key property: '_commKeyName'.
     *
     * Notice that changes in the '_commKeyName' produced by this class doesn't
     * trigger this event.
     */
    private _listenChangesFromOtherWindows(renderer: Renderer2): Function {
        return renderer.listen('window', 'storage', (event: StorageEvent) => {
            if (event.key === this._commKeyName) {
                this._updateUser();
            }
        });
    }

    /**
     * Check if the message is coming from the same domain we use to generate
     * the SSO URL, otherwise it's iffy and shouldn't trust it.
     */
    private _messageIsAcceptable(event: MessageEvent): boolean {
        return event.origin === this._appURL;
    }

    private _updateUser(invokeLoginCallbacks = true) {
        if (this._timeoutID) {
            window.clearTimeout(this._timeoutID);
        }

        if (this._tokenService.isTokenValid()) {
            this._user.next({
                uid: < string > this._getClaim('sub'),
                name: < string > this._getClaim('name'),
                nickname: < string > this._getClaim('nickname'),
                email: < string > this._getClaim('email'),
                token: < string > this._tokenService.getToken()
            });

            if (invokeLoginCallbacks) {
                this._loginCallbacks.forEach(callback => callback());
            }

            // Schedule future logout event base on token expiration
            const expireDate = < Date > this._tokenService.getTokenExpirationDate();
            // Coercing dates to numbers with the unary operator '+'
            const delay = +expireDate - +new Date();
            this._timeoutID = window.setTimeout(() => this.logOut(), delay);
        } else {
            this._storageRemover(); // Cleanup possible left behind token
            this._user.next(null);
            this._logoutCallbacks.forEach(callback => callback());
        }
    }

    private _getClaim(claim: string): string | null {
        return this._tokenService.getClaim < string, null > (claim, null);
    }

    private _deprecationWarning(oldMethod: string, newMethod: string) {
        window.console.warn(`Method '${oldMethod}' has been deprecated, please use '${newMethod}' method instead`);
    }
}
