import {
    InjectionToken
} from '@angular/core';

export interface AuthConfig {
    aapURL: string;
    tokenGetter: () => string;
    tokenRemover?: () => void;
    tokenUpdater: (newToken: any) => void;
}

export const AAP_CONFIG = new InjectionToken < AuthConfig > ('AAP_CONFIG');

export function getToken(): string {
    return localStorage.getItem('id_token') || '';
}
export function removeToken(): void {
    return localStorage.removeItem('id_token');
}
export function updateToken(newToken: string): void {
    return localStorage.setItem('id_token', newToken);
}
export const DEFAULT_CONF: AuthConfig = {
    aapURL: 'https://api.aai.ebi.ac.uk',
    tokenGetter: getToken,
    tokenRemover: removeToken,
    tokenUpdater: updateToken
};
