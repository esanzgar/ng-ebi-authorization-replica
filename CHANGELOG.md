<a name="1.0.0-beta.6"></a>
# [1.0.0-beta.6](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-beta.5...1.0.0-beta.6) (2019-01-24)

### Features
* only calls login and logout callbacks when change of state
* only emit user if the token has changed (similar to distinctUntilChanged)

<a name="1.0.0-beta.5"></a>

# [1.0.0-beta.5](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-beta.4...1.0.0-beta.5) (2019-01-23)

### Features
* added refresh token functionality.
* added functionality to remove listeners.
* marked windowOpen and tabOpen deprecated. Use instead, openLoginWindow,
  openLoginTab.
* added methods to work with local AAP accounts: create, login and change password to AAP account.

<a name="1.0.0-beta.4"></a>
# [1.0.0-beta.4](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-beta.3...1.0.0-beta.4) (2018-10-23)

### Features
* updated to angular version 7

<a name="1.0.0-beta.3"></a>
# [1.0.0-beta.3](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-beta.2...1.0.0-beta.3) (2018-10-23)

### Features
* no additional features

<a name="1.0.0-beta.2"></a>
# [1.0.0-beta.2](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-beta.1...1.0.0-beta.2) (2018-09-10)

### Features
* documentation improvements
* corrections on the name of the library.

<a name="1.0.0-beta.1"></a>
# [1.0.0-beta.1](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-alpha.11...1.0.0-beta.1) (2018-07-12)

### Features
* changed name of the library to `ng-ebi-authorization`
* uses `User` interface instead of `Credentials`
* `User` interface contain new member such  `uid` (unique identifier),
  `nickname`, etc.
* remove the alternative way of providing credential information

<a name="1.0.0-alpha.11"></a>
# [1.0.0-alpha.11](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-alpha.10...1.0.0-alpha.11) (2018-06-20)

### Features
* improved documentation

<a name="1.0.0-alpha.10"></a>
# [1.0.0-alpha.10](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-alpha.9...1.0.0-alpha.10) (2018-06-18)

### Features
* JwtModule must be set up independently of the AuthModule. Both must have the
  same tokenGetter function in order to work properly.

<a name="1.0.0-alpha.9"></a>
# [1.0.0-alpha.9](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-alpha.8...1.0.0-alpha.9) (2018-05-16)

### Features
* upgrade to @auth0/angular-jwt version 2 and drop dependency of rxjs-compat

<a name="1.0.0-alpha.8"></a>
# [1.0.0-alpha.8](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-alpha.7...1.0.0-alpha.8) (2018-05-08)

### Features
* upgrade to angular version 6.

<a name="1.0.0-alpha.7"></a>
# [1.0.0-alpha.7](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-alpha.6...1.0.0-alpha.7) (2018-02-27)

### Features
* **token:** getClaim function in some instances didn't return the default value
    when no value for the claim was found. Fixed.

<a name="1.0.0-alpha.6"></a>
# [1.0.0-alpha.6](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-alpha.5...1.0.0-alpha.6) (2018-02-16)

### Features
* None: published the wrong package into npm

<a name="1.0.0-alpha.5"></a>
# [1.0.0-alpha.5](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-alpha.4...1.0.0-alpha.5) (2018-02-16)

### Features

* **auth:** allow inter-window communication (changes in the JWT token are listened by other opened windows) ([9a13795](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/commit/9a13795)), closes [#1](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/issues/1)
* **auth:** remove expired JWT token (when users leave before the token is removed and then come back) ([2e59603](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/commit/2e59603))
* **conf:** make tokenRemover an optional function in the configuration. When
    not supplied, the JWT token is set to null.


<a name="1.0.0-alpha.4"></a>
# [1.0.0-alpha.4](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/compare/1.0.0-alpha.3...1.0.0-alpha.4) (2018-02-15)

### Features

* **auth:** added Credential interface for easy access to user data ([60b33f7e](https://gitlab.ebi.ac.uk/tools-glue/ng-ebi-authorization/commit/60b33f7e))
