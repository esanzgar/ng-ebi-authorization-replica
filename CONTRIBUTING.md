# Contributing to angular-aap-auth

Thanks for your willingness to contribute to the angular-aap-auth library.

## Setup

If you have writing permission into project's repo, then clone it locally.

```
git clone https://gitlab.ebi.ac.uk/tools-glue/angular-aap-auth

or

git clone git@gitlab.ebi.ac.uk:tools-glue/angular-aap-auth
```

Otherwise, fork the repo using GitLab, and submit pull requests.

All the commits should pass the `ng lint` command. Therefore, we recommend that
you set a `pre-commit` git hook in this way:

```
ln -s ../../githooks/pre-commit  .git/hooks/pre-commit
```

Optionally, to help you to adhere to the standard commit messages in the repo
we recommend the use of the following `prepare-commit-msg` git hook:

```
ln -s ../../githooks/prepare-commit-msg  .git/hooks/prepare-commit-msg
```

Then download the dependencies.

```
yarn

or

npm i
```


## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app
will automatically reload if you change any of the source files.

## Build library

Run `yarn packagr`  or `npm packagr` to build the library. The build artifacts
will be stored in the `dist-lib/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via
[Karma](https://karma-runner.github.io).
