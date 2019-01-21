import {
    ComponentFixture,
    TestBed,
    async
} from '@angular/core/testing';

import {
    CommonTestingModule
} from 'testing/common';

import {
    AuthService
} from 'src/app/modules/auth/auth.service';

import {
    AppComponent
} from './app.component';

describe('AppComponent', () => {
    let auth: AuthService;
    let fixture: ComponentFixture < AppComponent > ;
    let app: AppComponent;

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
    }));

    it('should create the app', async (() => {
        expect(app).toBeTruthy();
    }));

    it(`should not be authenticated`, async (() => {
        auth.logOut();
        app.isAuthenticated$.subscribe(result => {
            expect(result).toEqual('Nope');
        });
        auth.logOut();
    }));

    it('should render title in a h1 tag', async (() => {
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('h1').textContent).toContain('Auth testing app');
    }));
});
