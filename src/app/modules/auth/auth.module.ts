import {
    NgModule,
    Optional,
    SkipSelf,
    ModuleWithProviders,
} from '@angular/core';
import {
    CommonModule
} from '@angular/common';

import {
    AuthConfig,
    AAP_CONFIG
} from './auth.config';
import {
    AuthService
} from './auth.service';
import {
    JwtModule,
    JWT_OPTIONS,
    JwtHelperService
} from '@auth0/angular-jwt';

export function getToken(): string {
    const token = localStorage.getItem('id_token');
    if (token === null) {
        throw Error('Unable to access localStorage token');
    }
    return token;
}
export function removeToken(): void {
    return localStorage.removeItem('id_token');
}
export function updateToken(newToken: string): void {
    return localStorage.setItem('id_token', newToken);
}

@NgModule({
    imports: [
        CommonModule,
        // JwtModule.forRoot({
        //     config: {
        //         tokenGetter: getToken,
        //         whitelistedDomains: []
        //     }
        // })
    ],
    providers: [{
            provide: AAP_CONFIG,
            useValue: {
                aapURL: 'https://api.aai.ebi.ac.uk',
                tokenRemover: removeToken,
                tokenUpdater: updateToken,

            }
        },
        AuthService,
        {
            provide: JWT_OPTIONS,
            useValue: {
                tokenGetter: getToken,
            }
        },
        JwtHelperService
    ]
}) export class AuthModule {
    constructor(@Optional() @SkipSelf() parentModule: AuthModule) {
        if (parentModule) {
            throw new Error('AuthModule is already loaded. It should only be imported in your application\'s main module.');
        }
    }

    static forRoot(options?: AuthConfig): ModuleWithProviders {

        const tokenName = 'id_token';
        const defaultConf: AuthConfig = {
            aapURL: 'https://api.aai.ebi.ac.uk',
            tokenRemover: () => localStorage.removeItem(tokenName),
            tokenUpdater: (newToken: any) => localStorage.setItem(tokenName, newToken),
            config: {
                tokenGetter: () => {
                    return localStorage.getItem(tokenName) || '';
                }
            }
        };

        if (options && options.config && options.config.tokenGetter) {
            return {
                ngModule: AuthModule,
                providers: [{
                        provide: AAP_CONFIG,
                        useValue: options.config
                    },
                    AuthService,
                    {
                        provide: JWT_OPTIONS,
                        useValue: options.config
                    },
                    JwtHelperService
                ]
            };
        }

        return {
            ngModule: AuthModule,
            providers: [{
                    provide: AAP_CONFIG,
                    useValue: defaultConf
                },
                AuthService,
                {
                    provide: JWT_OPTIONS,
                    useValue: defaultConf.config
                },
                JwtHelperService
            ]
        };
    }
}
