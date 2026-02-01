import 'zone.js';
import '@angular/compiler';
import {bootstrapApplication} from '@angular/platform-browser';
import {provideZoneChangeDetection, LOCALE_ID} from '@angular/core';
import {AppComponent} from './app.component';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {provideRouter} from "@angular/router";
import {routes} from "./app/app.routes";
import {authInterceptor} from "./app/core/interceptors/auth.interceptor";

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// 3. REGISTRAR EL ESPAÑOL GLOBALMENTE 👇
registerLocaleData(localeEs, 'es');

bootstrapApplication(AppComponent, {
    providers: [
        provideZoneChangeDetection(),
        provideHttpClient(withFetch(),// esto reemplaza el HttpClientModule de versiones viejas
            withInterceptors([authInterceptor])),
        provideRouter(routes),
        { provide: LOCALE_ID, useValue: 'es' }
    ],
}).catch(err => console.error(err));
