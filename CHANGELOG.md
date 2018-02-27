<a name="1.0.0-alpha.7"></a>
# [1.0.0-alpha.7](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/compare/1.0.0-alpha.5...1.0.0-alpha.7) (2018-02-27)

### Features
* **token:** getClaim function in some instances didn't return the default value
    when no value for the claim was found. Fixed.

<a name="1.0.0-alpha.6"></a>

# [1.0.0-alpha.6](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/compare/1.0.0-alpha.5...1.0.0-alpha.6) (2018-02-16)

### Features
* None: published the wrong package into npm

<a name="1.0.0-alpha.5"></a>
# [1.0.0-alpha.5](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/compare/1.0.0-alpha.4...1.0.0-alpha.5) (2018-02-16)

### Features

* **auth:** allow inter-window communication (changes in the JWT token are listened by other opened windows) ([#1](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/issues/1) ([9a13795](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/commit/9a13795)), closes [#1](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/issues/1
* **auth:** remove expired JWT token (when users leave before the token is removed and then come back) ([#1](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/issues/1) ([2e59603](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/commit/2e59603))
* **conf:** make tokenRemover an optional function in the configuration. When
    not supplied, the JWT token is set to null.


<a name="1.0.0-alpha.4"></a>
# [1.0.0-alpha.4](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/compare/1.0.0-alpha.3...1.0.0-alpha.4) (2018-02-15)

### Features

* **auth:** added Credential interface for easy access to user data ([60b33f7e](https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth/commit/60b33f7e))
