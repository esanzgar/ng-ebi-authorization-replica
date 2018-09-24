import {
    Component,
    OnInit
} from '@angular/core';
import {
    Observable,
} from 'rxjs';
import {
    map
} from 'rxjs/operators';

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

@Component({
    selector: 'auth-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    user: Observable < User | null>;

    isAuthenticated: Observable < string > ;
    expiration: Observable < Date | null > ;

    constructor(
        // Public for demonstration purposes
        public auth: AuthService,
        private tokens: TokenService,
        private jwt: JwtHelperService
    ) {
        this.user = auth.user();

        this.isAuthenticated = this.user.pipe(
            map(value => value != null && 'Yes!' || 'Nope')
        );

        this.expiration = this.user.pipe(
            map(_ => {
                const token = this.tokens.getToken();
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
        this.auth.addLogInEventListener(() => alert('Welcome'));
        this.auth.addLogInEventListener(() => console.log('Welcome'));
        const firstEventID = this.auth.addLogInEventListener(() => console.log('This should not be visible'));
        this.auth.removeLogInEventListener(firstEventID);
        const secondEventID = this.auth.addLogInEventListener(() => alert('This should never be displayed'));
        this.auth.removeLogInEventListener(secondEventID);

        // Demostration of register and unregister logout events
        this.auth.addLogOutEventListener(() => console.log('Bye'));
        const thirdEventID = this.auth.addLogOutEventListener(() => console.log('This should not be visible'));
        this.auth.removeLogOutEventListener(thirdEventID);
        this.auth.addLogOutEventListener(() => alert('Bye'));
        const fourthEventID = this.auth.addLogOutEventListener(() => alert('This should never be displayed'));
        this.auth.removeLogOutEventListener(fourthEventID);
    }
}
