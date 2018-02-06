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
    Credentials
} from 'app/modules/auth/auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    authURL = 'https://api.aai.ebi.ac.uk';
    credentials: Observable < Credentials > ;
    username: Observable < string | null > ;
    isAuthenticated: Observable < string > ;

    constructor(
        public auth: AuthService,
    ) {
        this.credentials = auth.credentials$;
        this.username = auth.username$;
        this.isAuthenticated = (auth.isAuthenticated$).pipe(
            map(value => value && 'true' || 'false')
        );
    }

    ngOnInit() {
        // Register and unregister login events
        this.auth.addLogInEventListener(() => console.log('Welcome'));
        const firstEventID = this.auth.addLogInEventListener(() => console.log('This should not be visible'));
        this.auth.removeLogInEventListener(firstEventID);
        this.auth.addLogInEventListener(() => alert('Welcome'));
        const secondEventID = this.auth.addLogInEventListener(() => alert('This should never be displayed'));
        this.auth.removeLogInEventListener(secondEventID);

        // Register and unregister logout events
        this.auth.addLogOutEventListener(() => console.log('Bye'));
        const thirdEventID = this.auth.addLogOutEventListener(() => console.log('This should not be visible'));
        this.auth.removeLogOutEventListener(thirdEventID);
        this.auth.addLogOutEventListener(() => alert('Bye'));
        const fourthEventID = this.auth.addLogOutEventListener(() => alert('This should never be displayed'));
        this.auth.removeLogOutEventListener(fourthEventID);
    }
}
