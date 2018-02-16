# angular-aap-auth

[![npm version](https://badge.fury.io/js/angular-aap-auth.svg)](https://www.npmjs.com/package/angular-aap-auth)
[![npm downloads](https://img.shields.io/npm/dm/angular-aap-auth.svg)](https://www.npmjs.com/package/angular-aap-auth)
[![test and build status](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/badges/master/build.svg)](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/commits/master 'test and build status')
[![coverage report](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/badges/master/coverage.svg?job=test)](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/commits/master)

The angular-aap-auth is a simple authentication Angular library that relies on
EBI's Authentication and Authorization Profile (AAP) infrastructure. After
successful login, a JWT token is stored on the browser (via cookie, local or
session storage).

## Installation

To install this library, run:

```
npm install angular-aap-auth --save

or

yarn add angular-aap-auth
```

## Consuming the library

In your Angular `AppModule` (app.module.ts):

```typescript
import {
    BrowserModule
} from '@angular/platform-browser';
import {
    NgModule
} from '@angular/core';

import {
    AppComponent
} from './app.component';
import {
    AuthModule
} from 'angular-aap-auth';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AuthModule.forRoot(),
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {}
```

The default configuration uses localStorage to save the JWT token under the key
'id_token'. See [Advance usage](#advance-usage) for a more fine grained configuration.

Example use on a component:

```typescript
import {
    Component,
    OnInit
} from '@angular/core';
import {
    Observable,
} from 'rxjs/Observable';

import {
    AuthService,
    Credentials
} from 'angular-aap-auth';

@Component({
    selector: 'app-root',
    template: `
    <button (click)="auth.windowOpen()">Login small window</button>
    <button (click)="auth.tabOpen()" target="_blank">Login new tab</button>
    <button (click)="auth.logOut()" target="_blank">Logout</button>

    <div *ngIf="(credentials | async) as user; else loggedOut">
        <p>Real name: {{ user.realname }}</p>
        <p>Username: {{ user.username }}</p>
        <p>Token: {{ user.token }}</p>
    </div>
    <ng-template #loggedOut>
        <p>Please, log in.</p>
    </ng-template>
    `
})
export class AppComponent implements OnInit {
    credentials: Observable < Credentials | null > ;

    constructor(
        // Public for demonstration purposes
        public auth: AuthService,
    ) {
        this.credentials = auth.credentials();
    }

    ngOnInit() {
        this.auth.addLogInEventListener(() => console.log('Welcome'));
        this.auth.addLogOutEventListener(() => console.log('Bye'));
    }
}
```

Alternative approach:

```typescript
import {
    Component,
    OnInit
} from '@angular/core';
import {
    Observable,
} from 'rxjs/Observable';
import {
    map
} from 'rxjs/operators';

import {
    AuthService
} from 'angular-aap-auth';

@Component({
    selector: 'app-root',
    template: `
    <button (click)="auth.windowOpen()">Login small window</button>
    <button (click)="auth.tabOpen()" target="_blank">Login new tab</button>
    <button (click)="auth.logOut()" target="_blank">Logout</button>

    <p>Authenticated: {{ isAuthenticated|async }}</p>
    <p>Real name: {{ realname|async }}</p>
    <p>Username: {{ username|async }}</p>
    <p>Token: {{ token|async }}</p>
    `
})
export class AppComponent implements OnInit {
    username: Observable < string | null > ;
    realname: Observable < string | null > ;
    token: Observable < string | null > ;
    isAuthenticated: Observable < string > ;

    constructor(
        // Public for demonstration purposes
        public auth: AuthService,
    ) {
        this.username = auth.username();
        this.realname = auth.realname();
        this.token = auth.token();

        this.isAuthenticated = auth.isAuthenticated().pipe(
            map(value => value && 'true' || 'false')
        );
    }

    ngOnInit() {
        this.auth.addLogInEventListener(() => console.log('Welcome'));
        this.auth.addLogOutEventListener(() => console.log('Bye'));
    }
}
```

## Advance usage

Advance module configuration:

```typescript
import {
    BrowserModule
} from '@angular/platform-browser';
import {
    NgModule
} from '@angular/core';

import {
    AppComponent
} from './app.component';
import {
    AuthModule
} from 'angular-aap-auth';

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
        AuthModule.forRoot({
            aapURL: 'https://api.aai.ebi.ac.uk',
            tokenGetter: getToken,
            tokenUpdater: updateToken,
            tokenRemover: removeToken // Optional
        }),
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
    Observable,
} from 'rxjs/Observable';
import {
    map
} from 'rxjs/operators';

import {
    AuthService,
    TokenService // Only needed to inspect other claims in the JWT token
} from 'angular-aap-auth';

@Component({
    selector: 'app-root',
    template: `
    <button (click)="openLoginWindow()">Login small window</button>
    <button (click)="logOut()" target="_blank">Logout</button>

    <p>Real name: {{ realname|async }}</p>
    <p>Username: {{ username|async }}</p>
    <p>Expiration: {{ expiration|async }}</p>
    <p>ISS: {{ iss|async }}</p>
    <p>Token: {{ token|async }}</p>
    `
})
export class AppComponent implements OnInit {
    username: Observable < string | null > ;
    realname: Observable < string | null > ;
    token: Observable < string | null > ;

    // How to obtain other claims
    expiration: Observable < Date | null > ;
    iss: Observable < string | null > ;

    constructor(
        // Public for demonstration purposes
        private auth: AuthService,
        private jwt: TokenService
    ) {
        this.username = auth.username();
        this.realname = auth.realname();
        this.token = auth.token();

        this.expiration = this.token.pipe(
            map(token => jwt.getTokenExpirationDate())
        );

        this.iss = this.token.pipe(
            map(token => jwt.getClaim < string, null > ('iss', null))
        );
    }

    openLoginWindow() {
        // ttl: time of live, and location
        this.auth.windowOpen({
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
[contributing]: https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/blob/master/CONTRIBUTING.md
