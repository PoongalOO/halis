import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appConfig } from './app/app.config';
import { Router } from '@angular/router';

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,  // Étendre les providers définis dans appConfig
    provideAnimations(),
    Router
  ]
}).catch(err => console.error(err));
