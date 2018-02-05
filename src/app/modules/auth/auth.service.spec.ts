import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { spyOnClass } from 'jasmine-es6-spies';

import { AuthConfig } from './index';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';

class APP_CONFIG implements AuthConfig{
    authURL: "something";
}

class DummyComponent {}

describe('Service: Auth', () => {
  // secret sauce which we inject into the tests
  const tokenerSpy = spyOnClass(TokenService);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: DummyComponent }
        ])
      ],
      providers: [
        APP_CONFIG,
        { provide: TokenService, useValue: tokenerSpy },
        AuthService
      ]
    });
  });

  it('should ...', inject([AuthService], (service: AuthService) => {
    expect(service).toBeTruthy();
  }));

  it('should check token to see if user is logged in',
     inject([AuthService], (service: AuthService) => {

    tokenerSpy.isTokenExpired.and.returnValues(true, false);

    expect(service.loggedIn()).toBeFalsy();
    expect(service.loggedIn()).toBeTruthy();
    expect(tokenerSpy.isTokenExpired).toHaveBeenCalledTimes(2);
  }));
});
