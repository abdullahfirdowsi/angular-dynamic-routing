import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log('Application bootstrap successful');
  })
  .catch(err => {
    console.error('Error during bootstrap:', err);
  });
