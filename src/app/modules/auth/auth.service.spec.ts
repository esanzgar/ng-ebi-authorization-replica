import {
    TestBed,
    inject,
    fakeAsync,
    tick,
} from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import {
    tap
} from 'rxjs/operators';

import {
    AuthService,
    User
} from './auth.service';
import {
    TokenService
} from './token.service';
import {
    JWT_OPTIONS,
    JwtHelperService
} from '@auth0/angular-jwt';
import {
    CommonTestingModule,
    updateToken,
    removeToken,
} from 'testing/common';
import {
    VALID_TOKEN_1,
    VALID_TOKEN_2,
    EXPIRED_TOKEN_1
} from 'testing/tokens';
import {
    AAP_CONFIG,
    DEFAULT_CONF
} from './auth.config';

describe('AuthService', () => {

    describe('with an expired token', () => {

        beforeEach(() => {
            TestBed.configureTestingModule({
                imports: [
                    HttpClientTestingModule
                ],
                providers: [{
                        provide: JWT_OPTIONS,
                        useValue: {
                            tokenGetter: () => EXPIRED_TOKEN_1
                        }
                    },
                    JwtHelperService,
                    TokenService,
                    {
                        provide: AAP_CONFIG,
                        useValue: DEFAULT_CONF
                    },
                    AuthService
                ]
            });
        });

        it('must be created', inject([AuthService], (service: AuthService) => {
            expect(service).toBeTruthy();
        }));

        it('must provide null instead of a user', inject([AuthService], (service: AuthService) => {
            service.user().subscribe(user => expect(user).toBeNull());
        }));

    });

    describe('with valid token', () => {

        let service: AuthService;
        let user: User | null = null;

        beforeEach(() => {
            TestBed.configureTestingModule({
                imports: [
                    HttpClientTestingModule
                ],
                providers: [{
                        provide: JWT_OPTIONS,
                        useValue: {
                            tokenGetter: () => VALID_TOKEN_1
                        }
                    },
                    JwtHelperService,
                    TokenService,
                    {
                        provide: AAP_CONFIG,
                        useValue: DEFAULT_CONF
                    },
                    AuthService,
                ]
            });
        });

        beforeEach(inject([AuthService], (serv: AuthService) => {
            service = serv;
            service.user().subscribe(state => user = state);
        }));

        it('must be created', () => {
            expect(service).toBeTruthy();
        });

        it('must provide a user with valid fields', () => {
            expect(user).toEqual({
                uid: 'usr-1',
                name: 'Ed Munden Gras',
                nickname: '1',
                email: 'test@ebi.ac.uk',
                token: VALID_TOKEN_1
            });
            expect((service as any)._timeoutID).toBeGreaterThan(0);
        });

        it('must execute openLoginWindow', () => {
            const open = spyOn(window, 'open');

            let left, top, width, height = 0;

            // defaults
            width = 650;
            height = 1000;
            service.openLoginWindow();
            left = Math.round((window.screen.width - width) / 2);
            expect(left + width + left).toBe(window.screen.width);
            top = Math.round((window.screen.height - height) / 2);
            expect(top + height + top).toBe(window.screen.height);
            expect(open).toHaveBeenCalledWith(
                `${(service as any)._appURL}/sso?from=http%3A%2F%2Flocalhost%3A9876`,
                'Sign in to Elixir',
                // tslint:disable-next-line:max-line-length
                `width=${width},height=${height},left=${left},top=${top},personalbar=no,toolbar=no,scrollbars=yes,resizable=yes,directories=no,location=no,menubar=no,titlebar=no,toolbar=no`
            );

            service.openLoginWindow({}, 50000000, 100000000);
            expect(open).toHaveBeenCalledWith(
                `${(service as any)._appURL}/sso?from=http%3A%2F%2Flocalhost%3A9876`,
                'Sign in to Elixir',
                // tslint:disable-next-line:max-line-length
                'width=50000000,height=100000000,left=-1,top=-1,personalbar=no,toolbar=no,scrollbars=yes,resizable=yes,directories=no,location=no,menubar=no,titlebar=no,toolbar=no'
            );

            width = 50;
            height = 40;
            service.openLoginWindow({}, width, height);
            left = Math.round((window.screen.width - width) / 2);
            expect(left + width + left).toBe(window.screen.width);
            top = Math.round((window.screen.height - height) / 2);
            expect(top + height + top).toBe(window.screen.height);
            expect(open).toHaveBeenCalledWith(
                `${(service as any)._appURL}/sso?from=http%3A%2F%2Flocalhost%3A9876`,
                'Sign in to Elixir',
                // tslint:disable-next-line:max-line-length
                `width=${width},height=${height},left=${left},top=${top},personalbar=no,toolbar=no,scrollbars=yes,resizable=yes,directories=no,location=no,menubar=no,titlebar=no,toolbar=no`
            );

            service.openLoginWindow({}, 50, 50, 0, 0);
            expect(open).toHaveBeenCalledWith(
                `${(service as any)._appURL}/sso?from=http%3A%2F%2Flocalhost%3A9876`,
                'Sign in to Elixir',
                // tslint:disable-next-line:max-line-length
                'width=50,height=50,left=0,top=0,personalbar=no,toolbar=no,scrollbars=yes,resizable=yes,directories=no,location=no,menubar=no,titlebar=no,toolbar=no'
            );

            service.openLoginWindow({
                a: 'a',
                b: 'b'
            }, 50, 40, 50, 40);

            expect(open).toHaveBeenCalledWith(
                `${(service as any)._appURL}/sso?from=http%3A%2F%2Flocalhost%3A9876&a=a&b=b`,
                'Sign in to Elixir',
                // tslint:disable-next-line:max-line-length
                'width=50,height=40,left=50,top=40,personalbar=no,toolbar=no,scrollbars=yes,resizable=yes,directories=no,location=no,menubar=no,titlebar=no,toolbar=no'
            );

            service.openLoginWindow({
                a: 'a',
                b: 'b'
            }, 50, 50, 0, 0);

            expect(open).toHaveBeenCalledWith(
                `${(service as any)._appURL}/sso?from=http%3A%2F%2Flocalhost%3A9876&a=a&b=b`,
                'Sign in to Elixir',
                // tslint:disable-next-line:max-line-length
                'width=50,height=50,left=0,top=0,personalbar=no,toolbar=no,scrollbars=yes,resizable=yes,directories=no,location=no,menubar=no,titlebar=no,toolbar=no'
            );
        });

        it('must execute openLoginTab', () => {
            const open = spyOn(window, 'open');

            service.openLoginTab();
            expect(open).toHaveBeenCalledWith(
                `${(service as any)._appURL}/sso?from=http%3A%2F%2Flocalhost%3A9876`,
                'Sign in to Elixir',
            );

            service.openLoginTab({
                a: 'a',
                b: 'b'
            });
            expect(open).toHaveBeenCalledWith(
                `${(service as any)._appURL}/sso?from=http%3A%2F%2Flocalhost%3A9876&a=a&b=b`,
                'Sign in to Elixir',
            );
        });

        it('must create valid single-sign-on URL', () => {
            expect(service.getSSOURL({
                    'ttl': '30',
                    'o': '3'
                }))
                .toBe(`${(service as any)._appURL}/sso?from=http%3A%2F%2Flocalhost%3A9876&ttl=30&o=3`);
        });

        it('must limit the single-sign-on time-to-live argument to 1440 seconds', () => {
            expect(service.getSSOURL({
                    'ttl': '1441',
                    'o': '3'
                }))
                .toBe(`${(service as any)._appURL}/sso?from=http%3A%2F%2Flocalhost%3A9876&ttl=1440&o=3`);
        });
    });

    describe('with dynamic login/logout', () => {

        let service: AuthService;
        let httpController: HttpTestingController;
        let keyName: string;
        let messageCheck: jasmine.Spy;
        let user: User | null = null;

        beforeEach(() => {
            TestBed.configureTestingModule({
                imports: [
                    CommonTestingModule
                ],
            });

            httpController = TestBed.get(HttpTestingController);
        });

        afterEach(() => {
            httpController.verify();
        });

        beforeEach(inject([AuthService], (serv: AuthService) => {
            service = serv;
            service.user().subscribe(state => user = state);
            messageCheck = spyOn((service as any), '_messageIsAcceptable');
            keyName = (service as any)._commKeyName;
        }));

        it('must be able to login (through private _updateUser method) and logout', () => {
            service.logOut();
            expect(user).toBeNull('user must not be authenticated at this point');

            updateToken(VALID_TOKEN_1);
            (service as any)._updateUser();

            expect(user).not.toBeNull('user must be authenticated at this point');
            expect(user).toEqual({
                uid: 'usr-1',
                name: 'Ed Munden Gras',
                nickname: '1',
                email: 'test@ebi.ac.uk',
                token: VALID_TOKEN_1
            }, 'user must have correct details');

            service.logOut();
            expect(user).toBeNull('user must not be authenticated at this point');
        });

        it('must be able to login (emulating message from other window) and logout', fakeAsync(() => {
            messageCheck.and.returnValue(true);

            service.logOut();
            const timeStamp_1 = +(localStorage.getItem(keyName) as string);
            expect(user).toBeNull('user must not be authenticated at this point');

            // service.tabOpen(); // TODO

            tick(1);
            window.dispatchEvent(new MessageEvent('message', {
                data: VALID_TOKEN_1
            }));
            expect(messageCheck).toHaveBeenCalled();
            const timeStamp_2 = +(localStorage.getItem(keyName) as string);
            expect(timeStamp_1).toBeLessThan(timeStamp_2);

            expect(user).not.toBeNull('user must be authenticated at this point');
            expect(user).toEqual({
                uid: 'usr-1',
                name: 'Ed Munden Gras',
                nickname: '1',
                email: 'test@ebi.ac.uk',
                token: VALID_TOKEN_1
            }, 'user must have correct details');

            tick(1);
            window.dispatchEvent(new MessageEvent('message', {
                data: EXPIRED_TOKEN_1
            }));
            const timeStamp_3 = +(localStorage.getItem(keyName) as string);
            expect(timeStamp_2).toBeLessThan(timeStamp_3);
            expect(user).toBeNull('user must not be authenticated at this point');

            tick(1);
            service.logOut();
            expect(user).toBeNull('user must not be authenticated at this point');
            const timeStamp_4 = +(localStorage.getItem(keyName) as string);
            expect(timeStamp_3).toBeLessThan(timeStamp_4);
        }));

        it('must be able call login events', () => {
            messageCheck.and.returnValue(true);
            let hasExecuted = false;

            service.logOut();
            expect(user).toBeNull('user must not be authenticated at this point');
            service.addLogInEventListener(() => hasExecuted = true);

            expect(hasExecuted).toBe(false);
            window.dispatchEvent(new MessageEvent('message', {
                data: VALID_TOKEN_1
            }));

            expect(user).not.toBeNull('user must be authenticated at this point');
            expect(user).toEqual({
                uid: 'usr-1',
                name: 'Ed Munden Gras',
                nickname: '1',
                email: 'test@ebi.ac.uk',
                token: VALID_TOKEN_1
            }, 'user must have correct details');
            expect(hasExecuted).toBe(true);
            service.logOut();
        });

        it('must be able call logout events', () => {
            messageCheck.and.returnValue(true);
            let hasExecuted = false;

            service.logOut();
            expect(user).toBeNull('user must not be authenticated at this point');
            expect(hasExecuted).toBe(false);
            service.addLogOutEventListener(() => hasExecuted = true);

            window.dispatchEvent(new MessageEvent('message', {
                data: VALID_TOKEN_1
            }));

            expect(user).not.toBeNull('user must be authenticated at this point');
            expect(user).toEqual({
                uid: 'usr-1',
                name: 'Ed Munden Gras',
                nickname: '1',
                email: 'test@ebi.ac.uk',
                token: VALID_TOKEN_1
            }, 'user must have correct details');

            expect(hasExecuted).toBe(false);
            service.logOut();
            expect(hasExecuted).toBe(true);
        });

        it('must authenticate only after login from correct window source', () => {
            service.logOut();
            expect(user).toBeNull('user must not be authenticated at this point');

            window.dispatchEvent(new MessageEvent('message', {
                data: VALID_TOKEN_1
            }));

            messageCheck.and.callThrough();
            expect(messageCheck).toHaveBeenCalled();

            expect(user).toBeNull('user must not be authenticated at this point, incorrect window source');

            window.dispatchEvent(new MessageEvent('message', {
                data: VALID_TOKEN_1,
                origin: (service as any)._appURL
            }));

            expect(user).not.toBeNull('user must be authenticated at this point');
            expect(user).toEqual({
                uid: 'usr-1',
                name: 'Ed Munden Gras',
                nickname: '1',
                email: 'test@ebi.ac.uk',
                token: VALID_TOKEN_1
            }, 'user must have correct details');

            window.dispatchEvent(new MessageEvent('message', {
                data: EXPIRED_TOKEN_1,
                origin: (service as any)._appURL
            }));

            expect(user).toBeNull('user must not be authenticated at this point, incorrect window source');
            service.logOut();
        });

        it('must be able login (emulating localStorage communication) and logout', fakeAsync(() => {
            service.logOut();
            const timeStamp_1 = +(localStorage.getItem(keyName) as string);
            expect(user).toBeNull('user must not be authenticated at this point');

            tick(1);
            (service as any)._storageUpdater(VALID_TOKEN_1);
            window.localStorage.setItem(keyName, '' + new Date().getTime());
            window.dispatchEvent(new StorageEvent('storage', {
                key: keyName,
            }));

            const timeStamp_2 = +(localStorage.getItem(keyName) as string);
            expect(timeStamp_1).toBeLessThan(timeStamp_2);
            expect(user).not.toBeNull('user must be authenticated at this point');
            expect(user).toEqual({
                uid: 'usr-1',
                name: 'Ed Munden Gras',
                nickname: '1',
                email: 'test@ebi.ac.uk',
                token: VALID_TOKEN_1
            }, 'user must have correct details');

            tick(1);
            (service as any)._storageUpdater(EXPIRED_TOKEN_1);
            window.localStorage.setItem(keyName, '' + new Date().getTime());
            window.dispatchEvent(new StorageEvent('storage', {
                key: keyName,
            }));

            const timeStamp_3 = +(localStorage.getItem(keyName) as string);
            expect(timeStamp_2).toBeLessThan(timeStamp_3);
            expect(user).toBeNull('user must not be authenticated at this point');

            tick(1);
            service.logOut();
            expect(user).toBeNull('user must not be authenticated at this point');
            const timeStamp_4 = +(localStorage.getItem(keyName) as string);
            expect(timeStamp_3).toBeLessThan(timeStamp_4);
        }));

        it('should refresh token', () => {
            messageCheck.and.returnValue(true);
            let hasExecuted = 0;

            service.logOut();
            service.addLogInEventListener(() => ++hasExecuted);
            expect(user).toBeNull('user must not be authenticated at this point');

            window.dispatchEvent(new MessageEvent('message', {
                data: VALID_TOKEN_1
            }));

            expect(user).not.toBeNull('user must be authenticated at this point');
            expect(user).toEqual({
                uid: 'usr-1',
                name: 'Ed Munden Gras',
                nickname: '1',
                email: 'test@ebi.ac.uk',
                token: VALID_TOKEN_1
            }, 'user must have correct details');
            expect(hasExecuted).toBe(1);

            service.refresh().pipe(
                tap(hasRefreshed => expect(hasRefreshed).toBe(true)),
                tap(_ => expect(hasExecuted).toBe(1)),
                tap(_ => expect(user).toEqual({
                    uid: 'usr-2',
                    name: 'Alice Wonderland',
                    nickname: '2',
                    email: 'test@ebi.ac.uk',
                    token: VALID_TOKEN_2
                }))).subscribe();

            const req = httpController.expectOne(
                request => {
                    return request.url === `${(service as any)._appURL}/token` &&
                        request.headers.get('Authorization') === `Bearer ${VALID_TOKEN_1}`;

                }
            );

            expect(req.request.method).toBe('GET');
            req.flush(VALID_TOKEN_2, {
                status: 200,
                statusText: 'OK'
            });

            service.logOut();
        });

        it('should not refresh token', () => {
            messageCheck.and.returnValue(true);
            service.logOut();
            expect(user).toBeNull('user must not be authenticated at this point');

            window.dispatchEvent(new MessageEvent('message', {
                data: VALID_TOKEN_1
            }));

            expect(user).not.toBeNull('user must be authenticated at this point');
            expect(user).toEqual({
                uid: 'usr-1',
                name: 'Ed Munden Gras',
                nickname: '1',
                email: 'test@ebi.ac.uk',
                token: VALID_TOKEN_1
            }, 'user must have correct details');

            service.refresh().subscribe(hasRefreshed => {
                    expect(hasRefreshed).toBe(false);
                    expect(user).toEqual({
                        uid: 'usr-1',
                        name: 'Ed Munden Gras',
                        nickname: '1',
                        email: 'test@ebi.ac.uk',
                        token: VALID_TOKEN_1
                    }, 'user has not been updated');
                },
                error => 'ignored');

            const req = httpController.expectOne(
                request => {
                    return request.url === `${(service as any)._appURL}/token` &&
                        request.headers.get('Authorization') === `Bearer ${VALID_TOKEN_1}`;
                }
            );

            expect(req.request.method).toBe('GET');
            req.flush('deliberated 403', {
                status: 403,
                statusText: 'Forbidden'
            });

            service.logOut();
        });
    });
});

