import {
    Component,
    OnInit
} from '@angular/core';
import {
    FormGroup,
    FormBuilder,
    Validators
} from '@angular/forms';
import {
    HttpClient,
} from '@angular/common/http';
import {
    Observable,
    of
} from 'rxjs';
import {
    catchError,
    concatMap,
    filter,
    first,
    map,
    pluck,
    tap
} from 'rxjs/operators';

import {
    environment
} from 'src/environments/environment';

import {
    AuthService,
    User
} from './modules/auth/auth.service';
import {
    TokenService
} from './modules/auth/token.service';
import {
    JwtHelperService,
} from '@auth0/angular-jwt';

interface Domain {
    domainName: string;
    domainDesc: string;
    domainReference: string;
}

@Component({
    selector: 'auth-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    user$: Observable < User | null > ;
    isAuthenticated$: Observable < 'Yes!' | 'Nope' > ;
    expiration$: Observable < Date | null > ;
    domains$: Observable < string[] > ;
    managedDomains$: Observable < Domain[] > ;

    // TODO:
    // * only trigger logout callbacks if it was previously login
    // * display validation messages
    // * test forms
    // * add custom sync validator for username
    createAAP = this._fb.group({
        name: ['', {
            validators: [Validators.minLength(5), Validators.maxLength(255)]
        }],
        username: ['', {
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255)]
        }],
        password: ['', {
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255)]
        }],
        email: ['', {
            validators: [Validators.email, Validators.minLength(5), Validators.maxLength(255)]
        }],
        organization: ['', {
            validators: [Validators.maxLength(255)]
        }],
    });

    loginAAP = this._fb.group({
        username: ['', {
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255)]
        }],
        password: ['', {
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255)]
        }],
    });

    changePasswordAAP = this._fb.group({
        username: ['', {
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255)]
        }],
        oldPassword: ['', {
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255)]
        }],
        newPassword: ['', {
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255)]
        }],
    });

    domain = this._fb.group({
        domainName: ['', Validators.required],
        domainDesc: ['']
    });

    private readonly domainsURL = `${environment.aapURL}/domains`;
    private readonly authURL = `${environment.aapURL}/auth`;

    constructor(
        // Public for demonstration purposes
        public auth: AuthService,
        private _tokens: TokenService,
        // private _jwt: JwtHelperService,
        private _fb: FormBuilder,
        private _http: HttpClient
    ) {
        this.user$ = auth.user();

        this.isAuthenticated$ = this.user$.pipe(
            map(value => value ? 'Yes!' : 'Nope')
        );

        this.expiration$ = this.user$.pipe(
            map(_ => {
                try {
                    return _tokens.getTokenExpirationDate();
                } catch (e) {
                    return null;
                }
            })
        );

        /* More complicate version
        this.expiration$ = this.user$.pipe(
            map(_ => {
                const token = this._tokens.getToken();
                try {
                    return _jwt.getTokenExpirationDate( < string > token);
                } catch (e) {
                    return null;
                }
            })
        );
         */

        this.domains$ = this.user$.pipe(
            map(_ => {
                try {
                    return _tokens.getClaim < string[], string[] > ('domains', []);
                } catch (e) {
                    return [];
                }
            })
        );

        this.managedDomains$ = this.user$.pipe(
            concatMap(_ => this.listManagedDomains())
        );
    }

    ngOnInit() {
        // Demonstration of register and unregister login events
        this.auth.addLogInEventListener(() => alert('Welcome'));
        this.auth.addLogInEventListener(() => console.log('Welcome'));
        const firstEventID = this.auth.addLogInEventListener(() => console.log('This should not be visible'));
        this.auth.removeLogInEventListener(firstEventID);
        const secondEventID = this.auth.addLogInEventListener(() => alert('This should never be displayed'));
        this.auth.removeLogInEventListener(secondEventID);

        // Demonstration of register and unregister logout events
        this.auth.addLogOutEventListener(() => console.log('Bye'));
        const thirdEventID = this.auth.addLogOutEventListener(() => console.log('This should not be visible'));
        this.auth.removeLogOutEventListener(thirdEventID);
        this.auth.addLogOutEventListener(() => alert('Bye'));
        const fourthEventID = this.auth.addLogOutEventListener(() => alert('This should never be displayed'));
        this.auth.removeLogOutEventListener(fourthEventID);
    }

    refresh() {
        this.auth.refresh().pipe(
            first()
        ).subscribe();
    }

    /**
     * Create AAP account
     */
    createAAPaccount() {
        this.auth.createAAPaccount(this.createAAP.value).pipe(
            first(),
            filter(Boolean),
            tap(_ => this.createAAP.reset({
                name: '',
                username: '',
                password: '',
                organization: ''
            }))
        ).subscribe();
    }

    /**
     * Login AAP account
     */
    loginAAPaccount() {
        this.auth.loginAAP(this.loginAAP.value).pipe(
            first(),
            filter(Boolean),
            tap(_ => this.createAAP.reset({
                name: '',
                username: '',
            }))
        ).subscribe();
    }

    /**
     * Change password AAP account
     */
    changePasswordAAPaccount() {
        this.auth.changePasswordAAP(this.changePasswordAAP.value).pipe(
            first(),
            filter(Boolean),
            tap(_ => this.changePasswordAAP.reset({
                name: '',
                oldPassword: '',
                newPassword: ''
            }))
        ).subscribe();
    }

    /**
     * Create domain (group/team)
     *
     * @param name Name of the new domain/group/team
     * @param description Description of the new domain/group/team
     */
    createDomain(uid: string): void {
        this._http.post < Domain > (this.domainsURL, this.domain.value, {
            observe: 'response',
        }).pipe(
            first(),
            map(response => {
                if (response.status === 201 && response.body) {
                    this.refresh();
                    return response.body.domainReference;
                }
                return null;
            }),
            tap(_ => this.domain.reset({
                domainName: '',
                domainDesc: ''
            })),
            filter(Boolean),
            concatMap(gid => this._http.put < Domain > (`${this.domainsURL}/${gid}/${uid}/user`, null, {
                observe: 'response',
            })),
            first(),
            map(response => {
                this.refresh();
                return response;
            }),
        ).subscribe();
    }

    /**
     * Delete domain (group/team)
     *
     * @param gid Domain ID
     */
    deleteDomain(gid: string): void {
        console.log(gid);
        this._http.delete < Domain > (`${this.domainsURL}/${gid}`, ).pipe(
            first(),
            tap(_ => this.refresh())
        ).subscribe();
    }

    /**
     * List domains that the user manage
     */
    listManagedDomains() {
        return this._http.get < Domain[] > (`${environment.aapURL}/my/management`).pipe(
            first(),
            catchError(error => of ([]))
        );
    }
}

