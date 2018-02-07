import {
    InjectionToken
} from '@angular/core';
import {
    JwtModuleOptions
} from '@auth0/angular-jwt';

export interface AuthConfig extends JwtModuleOptions {
    aapURL: string;
    // tokenGetter: () => string | null;
    tokenRemover: () => void;
    tokenUpdater: (newToken: any) => void;
}

export const AAP_CONFIG = new InjectionToken < AuthConfig > ('AAP_CONFIG');
