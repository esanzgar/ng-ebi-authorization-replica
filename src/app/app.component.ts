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
} from 'app/modules/auth/auth.service';
import {
    JwtHelperService,
} from '@auth0/angular-jwt';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    username: Observable < string | null > ;
    realname: Observable < string | null > ;
    token: Observable < string | null > ;
    isAuthenticated: Observable < string > ;

    // How to obtain other claims
    expiration: Observable < Date | null > ;

    constructor(
        // Public for demostration purposes
        public auth: AuthService,
        private jwt: JwtHelperService
    ) {
        this.username = auth.username();
        this.realname = auth.realname();
        this.token = auth.token();

        this.isAuthenticated = (auth.isAuthenticated()).pipe(
            map(value => value && 'true' || 'false')
        );

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
        // Demostration of register and unregister login events
        this.auth.addLogInEventListener(() => console.log('Welcome'));
        const firstEventID = this.auth.addLogInEventListener(() => console.log('This should not be visible'));
        this.auth.removeLogInEventListener(firstEventID);
        this.auth.addLogInEventListener(() => alert('Welcome'));
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
