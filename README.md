# ng-ebi-authorization

The ng-ebi-authorization is a simple authentication Angular library that relies
on EBI's Authentication and Authorization Profile (AAP) infrastructure. After
successful login, a JWT token is stored on the browser (via cookie, local or
session storage).

Because of CORS, if the library is tested against 'explore.api.aai.ebi.ac.uk' origin should be localhost:4200.

[See example in stackblitz](https://stackblitz.com/github/esanzgar/ng-ebi-authorization-replica).

## Installation

To install this library, run:

```
npm install --save ng-ebi-authorization @auth0/angular-jwt

or

yarn add ng-ebi-authorization @auth0/angular-jwt
```

Compatibility table

| Angular version | ng-ebi-authorization version                                                        |
| --------------- | ----------------------------------------------------------------------------------- |
| >=5 <6          | <= angular-aap-auth@1.0.0-alpha.7 (deprecated)                                      |
| >=6 <8          | >= angular-aap-auth@1.0.0-alpha.8 (deprecated) or ng-ebi-authorization@1.0.0-beta.1 |

ng-ebi-authorization is an updated version of angular-aap-auth.

## Consuming the library

The library exposes user information through `User` objects, which have information that's usually required for web application to work:

- The unique identifier (`uid`): if a unique identifier has to be used, use this field.
- Name (`name`): the full name of the user, for display purposes
- Nickname (`nickname`): if the user is in a local aap account, it will contain
  the username, otherwise will have a weird string.
- Email (`email`): the account's email, this is for information only and several
  accounts may have the same username.
- Domains (`domains`): not directly provided because they may be misused.
  The checking of domains should be done always server-side. If the domains
  information wants to be shown to the user as information it can still be done,
  check the [Advanced usage](#advanced-usage) to see how to expose arbitrary
  token claims, or the embedded app.

In your Angular `AppModule` (app.module.ts):

```typescript
import {
    BrowserModule
} from '@angular/platform-browser';
import {
    NgModule
} from '@angular/core';

import {
    HttpClientModule
} from '@angular/common/http';
import {
    AuthModule
} from 'ng-ebi-authorization';
import {
    JwtModule
} from '@auth0/angular-jwt';

import {
    AppComponent
} from './app.component';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AuthModule.forRoot(), // Defaults to localStorage `id_token` key.
        JwtModule.forRoot({
            config: {
                tokenGetter: () => localStorage.getItem('id_token')
            }
        })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {}
```

The default configuration uses localStorage to save the JWT token under the key
'id_token'. See [Advanced usage](#advanced-usage) for a more fine grained configuration.

Example use on a component:

```typescript
import {
    Component,
    OnInit
} from '@angular/core';
import {
    Observable,
} from 'rxjs';

import {
    AuthService,
    User
} from 'ng-ebi-authorization';

@Component({
    selector: 'app-root',
    template: `
    <button (click)="auth.openLoginWindow()">Login small window</button>
    <button (click)="auth.openLoginTab()">Login new tab</button>
    <button (click)="auth.logOut()">Logout</button>

    <div *ngIf="user | async; else loggedOut">
        <p>Name: {{ user.name }}</p>
        <p>Unique Identifier: {{ user.uid }}</p>
        <p>Email: {{ user.email }}</p>
        <p>Token: {{ user.token }}</p>
    </div>
    <ng-template #loggedOut>
        <p>Please, log in.</p>
    </ng-template>
    `
})
export class AppComponent implements OnInit {
    user: Observable < User | null > ;

    constructor(
        // Public for demonstration purposes
        public auth: AuthService,
    ) {
        this.user = auth.user();
    }

    ngOnInit() {
        this.auth.addLogInEventListener(() => console.log('Welcome'));
        this.auth.addLogOutEventListener(() => console.log('Bye'));
    }
}
```

## Advanced usage

Advanced module configuration:

```typescript
import {
    BrowserModule
} from '@angular/platform-browser';
import {
    NgModule
} from '@angular/core';

import {
    HttpClientModule
} from '@angular/common/http';
import {
    AuthModule
} from 'ng-ebi-authorization';
import {
    JwtModule
} from '@auth0/angular-jwt';

import {
    AppComponent
} from './app.component';

export function getToken(): string {
    return localStorage.getItem('jwt_token') || '';
}
export function updateToken(newToken: string): void {
    return localStorage.setItem('jwt_token', newToken);
}
// Optional
export function removeToken(): void {
    return localStorage.removeItem('jwt_token');
}

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule
        AuthModule.forRoot({
            aapURL: 'https://api.aai.ebi.ac.uk',
            tokenGetter: getToken,
            tokenUpdater: updateToken,
            tokenRemover: removeToken // Optional
        }),
        JwtModule.forRoot({
            config: {
                tokenGetter: getToken,
                whitelistedDomains: ['api.aai.ebi.ac.uk'], // Necessary for creating domains
                blacklistedRoutes: ['https://api.aai.ebi.ac.uk/auth'] // Necessary for login via AAP local account (instead of ELIXIR)
            }
        })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {}
```

Example on how to get specific claims:

```typescript
import {
    Component,
    OnInit
} from '@angular/core';
import {
    Observable
} from 'Observable';
import {
    map
} from 'rxjs/operators';

import {
    AuthService,
    TokenService // Needed for JWT claim introspection
} from 'ng-ebi-authorization';

import {
    JwtHelperService,
} from '@auth0/angular-jwt';

@Component({
    selector: 'app-root',
    template: `
    <button (click)="openLoginWindow()">Login small window</button>
    <button (click)="logOut()">Logout</button>

    <div *ngIf="(user | async) as user; else loggedOut">
        <p>Expiration Date: {{ expiration | async }}</p>
        <p>Issuer: {{ iss | async }}</p>

    </div>
    <ng-template #loggedOut>
        <p>Please, log in.</p>
    </ng-template>
    `
})
export class AppComponent implements OnInit {
    user: Observable < User | null > ;

    // How to obtain other claims
    expiration: Observable < Date | null > ;
    domains: Observable < string[] > ;
    iss: Observable < string | null > ;

    constructor(
        // Public for demonstration purposes
        private auth: AuthService,
        private token: TokenService
    ) {
        this.user = auth.user();

        this.expiration = this.user.pipe(
            map(user => token.getTokenExpirationDate())
        );

        this.domains = this.user.pipe(
            map(_ => _tokens.getClaim < string[], string[] > ('domains', []))
        );

        this.iss = this.user.pipe(
            map(_ => token.getClaim < string, null > ('iss', null))
        );
    }

    openLoginWindow() {
        // ttl: time of live, and location
        this.auth.openLoginWindow({
            'ttl': '1'
        }, 500, 500, 100, 100);
    }

    logOut() {
        this.auth.logOut();
    }

    ngOnInit() {
        // Demonstration of register and unregister login events
        this.auth.addLogInEventListener(() => console.log('Welcome'));
        const firstEventID = this.auth.addLogInEventListener(() => console.log('This should not be visible'));
        this.auth.removeLogInEventListener(firstEventID);
        this.auth.addLogInEventListener(() => alert('Welcome'));
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
}
```

## Want to help?

Want to file a bug, contribute some code, or improve documentation? Excellent!
Read up on our guidelines for [contributing][contributing].

## License

Apache 2.0 © [EMBL - European Bioinformatics Institute](https://www.ebi.ac.uk/about/terms-of-use)

[contributing]: https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/blob/master/CONTRIBUTING.md
