import {
    Component,
    Inject,
    OnInit
} from '@angular/core';
import {
    FormGroup,
    FormBuilder,
    Validators,
    ValidatorFn
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
    AAP_CONFIG,
    AuthConfig
} from 'src/app/modules/auth/auth.config';

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

function spacesNoAllowedStartEnd(): ValidatorFn {
    return (control) => {
        const hasForbiddenSpaces = /^\s+|\s+$/.test(control.value);
        return hasForbiddenSpaces ? {
            hasForbiddenSpaces: 'white space is not allowed at the begining or end'
        } : null;
    };
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

    createAAP = this._fb.group({
        name: [null, {
            validators: [Validators.minLength(1), Validators.maxLength(255)]
        }],
        username: [null, {
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255), spacesNoAllowedStartEnd()]
        }],
        password: [null, {
            validators: [Validators.required, Validators.maxLength(255)]
        }],
        email: [null, {
            validators: [Validators.email, Validators.maxLength(255)]
        }],
        organization: [null, {
            validators: [Validators.maxLength(255)]
        }],
    });
    createAAPErrors$!: Observable<string[]>;

    loginAAP = this._fb.group({
        username: [null, {
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255), spacesNoAllowedStartEnd()]
        }],
        password: [null, {
            validators: [Validators.required, Validators.maxLength(255)]
        }],
    });
    loginAAPErrors$!: Observable<string[]>;

    changePasswordAAP = this._fb.group({
        username: [null, {
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255), spacesNoAllowedStartEnd()]
        }],
        oldPassword: [null, {
            validators: [Validators.required, Validators.maxLength(255)]
        }],
        newPassword: [null, {
            validators: [Validators.required, Validators.maxLength(255)]
        }],
    });
    changePasswordAAPErrors$!: Observable<string[]>;

    domain = this._fb.group({
        domainName: [null, {
            validators: [Validators.required]
        }],
        domainDesc: [null]
    });

    domainErrors$!: Observable<string[]>;

    private readonly _domainsURL: string;
    private readonly _authURL: string;
    private readonly _managementURL: string;

    constructor(
        // Public for demonstration purposes
        public auth: AuthService,
        private _tokens: TokenService,
        // private _jwt: JwtHelperService,
        private _fb: FormBuilder,
        private _http: HttpClient,
        @Inject(AAP_CONFIG) private _config: AuthConfig
    ) {
        this._domainsURL = `${_config.aapURL}/domains`;
        this._authURL = `${_config.aapURL}/auth`;
        this._managementURL = `${_config.aapURL}/my/management`;

        this.user$ = auth.user();

        this.isAuthenticated$ = this.user$.pipe(
            map(value => value ? 'Yes!' : 'Nope')
        );

        this.expiration$ = this.user$.pipe(
            map(_ => _tokens.getTokenExpirationDate())
        );

        /* More complicate version
        this.expiration$ = this.user$.pipe(
            map(_ => {
                const token = this._tokens.getToken();
                try {
                    return _jwt.getTokenExpirationDate( < string > token);
                } catch (error) {
                    return null;
                }
            })
        );
         */

        this.domains$ = this.user$.pipe(
            map(_ => _tokens.getClaim < string[], string[] > ('domains', []))
        );

        this.managedDomains$ = this.user$.pipe(
            concatMap(_ => this.listManagedDomains())
        );
    }

    ngOnInit() {
        this.createAAPErrors$ = this.createAAP.valueChanges.pipe(
            map( _ => this._getErrors(this.createAAP))
        );

        this.loginAAPErrors$ = this.loginAAP.valueChanges.pipe(
            map( _ => this._getErrors(this.loginAAP))
        );

        this.changePasswordAAPErrors$ = this.changePasswordAAP.valueChanges.pipe(
            map( _ => this._getErrors(this.changePasswordAAP))
        );

        this.domainErrors$ = this.domain.valueChanges.pipe(
            map( _ => this._getErrors(this.domain))
        );

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
            tap(_ => this.createAAP.reset())
        ).subscribe();
    }

    /**
     * Login AAP account
     */
    loginAAPaccount() {
        this.auth.loginAAP(this.loginAAP.value).pipe(
            first(),
            filter(Boolean),
            tap(_ => this.loginAAP.reset())
        ).subscribe();
    }

    /**
     * Change password AAP account
     */
    changePasswordAAPaccount() {
        this.auth.changePasswordAAP(this.changePasswordAAP.value).pipe(
            first(),
            filter(Boolean),
            tap(_ => this.changePasswordAAP.reset())
        ).subscribe();
    }

    /**
     * Create domain (group/team)
     *
     * @param name Name of the new domain/group/team
     * @param description Description of the new domain/group/team
     */
    createDomain(uid: string): void {
        this._http.post < Domain > (this._domainsURL, this.domain.value).pipe(
            first(),
            pluck('domainReference'),
            filter(Boolean),
            tap(_ => this.refresh()),
            tap(_ => this.domain.reset()),
            concatMap(gid => this._http.put < Domain > (`${this._domainsURL}/${gid}/${uid}/user`, null)),
            tap(_ => this.refresh())
        ).subscribe();
    }

    /**
     * Delete domain (group/team)
     *
     * @param gid Domain ID
     */
    deleteDomain(gid: string): void {
        console.log(gid);
        this._http.delete < Domain > (`${this._domainsURL}/${gid}`, ).pipe(
            first(),
            tap(_ => this.refresh())
        ).subscribe();
    }

    /**
     * List domains that the user manage
     */
    listManagedDomains() {
        return this._http.get < Domain[] > (`${this._config.aapURL}/my/management`).pipe(
            first(),
            catchError(error => of ([]))
        );
    }

    private _getErrors(form: FormGroup): string[] {
        const message: string[] = [];

        Object.entries(form.controls).forEach(([name, control]) => {
            if (control.errors && control.invalid && (control.dirty || control.touched)) {
                Object.entries(control.errors).forEach(([error, content]) => {
                    const namePretty = this._capitalise(name);
                    switch (error) {
                        case 'minlength':
                            message.push(`${namePretty}: minimum ${content['requiredLength']} characters`);
                            break;
                        case 'maxlength':
                            message.push(`${namePretty}: maximum  ${content['requiredLength']} characters`);
                            break;
                        case 'required':
                            message.push(`${namePretty}: required`);
                            break;
                        case 'email':
                            message.push(`${namePretty}: not valid`);
                            break;
                        case 'hasForbiddenSpaces':
                            message.push(`${namePretty}: ${content}`);
                            break;
                        default:
                            console.warn(namePretty, error, content);
                    }
                });
            }
        });

        return message;
    }

    private _capitalise(word: string, locale?: string): string {
        // charAt is problematic with unicode
        return word.charAt(0).toLocaleUpperCase() + word.slice(1).replace(/([A-Z])/g, (u) => ` ${u.toLocaleLowerCase()}`);
    }
}
