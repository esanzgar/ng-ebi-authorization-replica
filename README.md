# angular-aap-auth

[![test and build status](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/badges/master/build.svg)](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/commits/master 'test and build status')
[![coverage report](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/badges/master/coverage.svg?job=test)](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/commits/master)
[![npm version](https://badge.fury.io/js/angular-aap-auth.svg)](https://www.npmjs.com/package/angular-aap-auth)
[//]: # (shiels.io is slow: [![npm version](https://img.shields.io/npm/v/angular-aap-auth)](https://www.npmjs.com/package/angular-aap-auth))
[![npm downloads](https://img.shields.io/npm/dm/angular-aap-auth.svg)](https://www.npmjs.com/package/angular-aap-auth)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

The angular-aap-auth is a simple authentication Angular library that relies on
EBI's Authentication and Authorization Profile (AAP) infrastructure. After
successful login, a JWT token is stored on the browser (via cookie, local or
session storage).

## Want to help?

Want to file a bug, contribute some code, or improve documentation? Excellent!
Read up on our guidelines for [contributing][contributing].

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
} from './modules/auth/auth.module';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AuthModule.forRoot(),
    ],
    providers: [
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
```

The default configuration uses localStorage to save the JWT token under the key
'id_token'. See [Advance usage](Advance usage) for a more fine grained configuration.

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
    map
} from 'rxjs/operators';

import {
    AuthService,
} from 'angular-aap-auth/auth.service';

@Component({
    selector: 'app-root',
    template: `<h1>Welcome</h1>
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

        this.isAuthenticated = (auth.isAuthenticated()).pipe(
            map(value => value && 'true' || 'false')
        );
    }

    ngOnInit() {
        this.auth.addLogInEventListener(() => console.log('Welcome'));
        this.auth.addLogOutEventListener(() => console.log('Bye'));
    }
}
```

## Advance uses

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
} from './modules/auth/auth.module';

export function getToken(): string {
    return localStorage.getItem('jwt_token') || '';
}
export function removeToken(): void {
    return localStorage.removeItem('jwt_token');
}
export function updateToken(newToken: string): void {
    return localStorage.setItem('jwt_token', newToken);
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
            tokenRemover: removeToken,
        }),
    ],
    providers: [
    ],
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
} from 'angular-aap-auth/auth.service';

// Only need to inspect other claims in the JWT token
import {
    TokenService,
} from 'angular-aap-auth/token.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    username: Observable < string | null > ;
    realname: Observable < string | null > ;
    token: Observable < string | null > ;

    // How to obtain other claims
    expiration: Observable < Date | null > ;

    constructor(
        // Public for demonstration purposes
        public auth: AuthService,
        private jwt: TokenService
    ) {
        this.username = auth.username();
        this.realname = auth.realname();
        this.token = auth.token();

        this.expiration = this.token.pipe(
            map(token => {
                try {
                    return jwt.getTokenExpirationDate(<string>token);
                } catch (e) {
                    return null;
                }

            })
        );
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

## License

Apache 2.0 © [EMBL - European Bioinformatics Institute](https://www.ebi.ac.uk/about/terms-of-use)
[contributing]: http://github.com/angular/angular/blob/master/CONTRIBUTING.md
