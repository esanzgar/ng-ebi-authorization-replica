import {
    ComponentFixture,
    TestBed,
    async
} from '@angular/core/testing';
import {
    HttpTestingController
} from '@angular/common/http/testing';
import {
    of
} from 'rxjs';
import {
    first,
    tap
} from 'rxjs/operators';

import {
    CommonTestingModule
} from 'testing/common';

import {
    AuthService
} from 'src/app/modules/auth/auth.service';

import {
    AppComponent
} from './app.component';
import {
    VALID_TOKEN_1
} from 'testing/tokens';

describe('AppComponent', () => {
    let auth: AuthService;
    let fixture: ComponentFixture < AppComponent > ;
    let app: AppComponent;
    let httpController: HttpTestingController;

    beforeEach(async (() => {
        TestBed.configureTestingModule({
            imports: [
                CommonTestingModule,
            ],
            declarations: [
                AppComponent
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        app = fixture.componentInstance;

        auth = TestBed.get(AuthService);
        httpController = TestBed.get(HttpTestingController);
    }));

    afterEach(() => {
        auth.logOut();
        auth.ngOnDestroy();
    });

    it('should create the app', () => {
        expect(app).toBeTruthy();
    });

    it(`should call refresh`, () => {
        const refresh = spyOn(auth, 'refresh').and.returnValue( of (true));
        app.refresh();
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it(`should create AAP account`, () => {
        const createAccount = spyOn(auth, 'createAAPaccount').and.returnValue( of (true));

        const initialState = {
            ...app.createAAP.value
        };
        expect(app.createAAP.invalid).toBe(true);

        const firstUser = {
            ...initialState,
            username: 'username',
            password: '44444'
        };
        app.createAAP.reset(firstUser);
        expect(app.createAAP.valid).toBe(true);
        app.createAAPaccount();
        expect(createAccount).toHaveBeenCalledWith(firstUser);
        expect(app.createAAP.value).toEqual(initialState);
        expect(app.createAAP.invalid).toBe(true);

        const secondUser = {
            name: '12345',
            username: 'username',
            password: 'password',
            email: 'email@com',
            organization: 'organization'
        };
        app.createAAP.reset(secondUser);
        expect(app.createAAP.valid).toBe(true);
        app.createAAPaccount();
        expect(createAccount).toHaveBeenCalledWith(secondUser);
        expect(app.createAAP.value).toEqual(initialState);
        expect(app.createAAP.invalid).toBe(true);
    });

    it(`should login AAP account`, () => {
        expect(app.loginAAP.invalid).toBe(true);
        const initialState = {
            ...app.loginAAP.value
        };

        app.loginAAP.reset({
            username: 'test1',
            password: 'bbbbb'
        });
        expect(app.loginAAP.valid).toBe(true);

        app.loginAAPaccount();

        httpController.expectOne((app as any)._authURL).flush(VALID_TOKEN_1);

        app.isAuthenticated$.pipe(
            first(),
            tap(result => expect(result).toEqual('Yes!')),
            tap(_ => expect(app.loginAAP.value).toEqual(initialState)),
            tap(_ => expect(app.loginAAP.invalid).toBe(true))
        ).subscribe();
    });

    it(`should change password AAP account`, () => {
        const changePassword = spyOn(auth, 'changePasswordAAP').and.returnValue( of (true));

        const initialState = {
            ...app.changePasswordAAP.value
        };
        expect(app.changePasswordAAP.invalid).toBe(true);

        const firstChange = {
            username: 'username',
            oldPassword: '44444',
            newPassword: '12345'
        };
        app.changePasswordAAP.reset(firstChange);
        expect(app.changePasswordAAP.valid).toBe(true);
        app.changePasswordAAPaccount();
        expect(changePassword).toHaveBeenCalledWith(firstChange);
        expect(app.changePasswordAAP.value).toEqual(initialState);
        expect(app.changePasswordAAP.invalid).toBe(true);
    });

    it(`should create domain`, () => {
        const refresh = spyOn(app, 'refresh');

        // Login so we can see the Authorization header
        app.loginAAP.reset({
            username: 'test1',
            password: 'bbbbb'
        });
        expect(app.loginAAP.valid).toBe(true);

        app.loginAAPaccount();

        const uid = 'dummy-uid';
        const newDomain = 'my-new-domain';

        const loginRequests = httpController.expectOne((app as any)._authURL);
        loginRequests.flush(VALID_TOKEN_1);
        expect(loginRequests.request.headers.get('Authorization')).toMatch(/Basic .+/);

        app.domains$.pipe(
            first(),
            tap(domains => expect(domains).toEqual(['aap-users-domain']))
        ).subscribe();

        const initialState = {
            ...app.domain.value
        };
        expect(app.domain.invalid).toBe(true);

        // Partial completion
        app.domain.reset({
            domainDesc: ''
        });
        expect(app.domain.invalid).toBe(true);

        const firstDomain = {
            domainName: 'hello'
        };
        app.domain.reset(firstDomain);
        expect(app.domain.valid).toBe(true);
        app.createDomain(uid);

        const domainRequests0 = httpController.expectOne((app as any)._domainsURL);
        domainRequests0.flush({
            domainReference: newDomain
        });
        const domainRequests1 = httpController.expectOne(`${(app as any)._domainsURL}/${newDomain}/${uid}/user`);
        domainRequests1.flush('ignored');

        expect(domainRequests0.request.headers.get('Authorization')).toMatch(`Bearer ${VALID_TOKEN_1}`);
        expect(domainRequests0.request.method).toBe('POST');

        expect(domainRequests1.request.headers.get('Authorization')).toMatch(`Bearer ${VALID_TOKEN_1}`);
        expect(domainRequests1.request.method).toBe('PUT');

        expect(refresh).toHaveBeenCalledTimes(2);
        auth.logOut();
    });

    it(`should delete domain`, () => {
        const refresh = spyOn(app, 'refresh');
        const gid = 'my-gid';

        app.deleteDomain(gid);

        const req = httpController.expectOne(`${(app as any)._domainsURL}/${gid}`);
        req.flush('dummy');

        expect(req.request.method).toBe('DELETE');
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it(`should list managed domains`, () => {
        const managedDomains = spyOn(app, 'listManagedDomains').and.callThrough();

        const myManagedDomains = [{
            domainName: 'domainName',
            domainDesc: 'domainDesc',
            domainReference: 'domainReference'
        }];

        app.managedDomains$.pipe(
            first(),
            tap(domains => expect(domains).toEqual(myManagedDomains))
        ).subscribe();

        httpController.expectOne((app as any)._managementURL).flush(myManagedDomains);

        expect(managedDomains).toHaveBeenCalledTimes(1);
    });

    it(`should fail to list managed domains`, () => {
        const managedDomains = spyOn(app, 'listManagedDomains').and.callThrough();

        const myManagedDomains = [{
            domainName: 'domainName',
            domainDesc: 'domainDesc',
            domainReference: 'domainReference'
        }];

        app.managedDomains$.pipe(
            first(),
            tap(domains => expect(domains).toEqual([]))
        ).subscribe();

        httpController.expectOne((app as any)._managementURL).flush(myManagedDomains, {
            status: 500,
            statusText: 'Problem'
        });

        expect(managedDomains).toHaveBeenCalledTimes(1);
    });

    it(`should not be authenticated`, () => {
        auth.logOut();
        app.isAuthenticated$.pipe(
            first(),
            tap(result => expect(result).toEqual('Nope'))
        ).subscribe();
    });

    it('should render title in a h1 tag', () => {
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('h1').textContent).toContain('Auth testing app');
    });
});
