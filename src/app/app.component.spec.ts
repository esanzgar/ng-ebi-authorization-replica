import {
    TestBed,
    async
} from '@angular/core/testing';
import {
    fakeAsync,
    flushMicrotasks
} from '@angular/core/testing';

import {
    AppComponent
} from './app.component';
import {
    CommonStub
} from 'app/../../testing/common';

describe('AppComponent', () => {
    beforeEach(async (() => {
        TestBed.configureTestingModule({
            imports: [
                CommonStub
            ],
            declarations: [
                AppComponent
            ],
        }).compileComponents();
    }));
    it('should create the app', async (() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    }));
    it(`should not be authenticated`, async (() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        app.isAuthenticated.subscribe((result: any) => {
            expect(result).toEqual('Nope');
        });
    }));
    it('should render title in a h1 tag', async (() => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('h1').textContent).toContain('Auth testing app');
    }));
});
