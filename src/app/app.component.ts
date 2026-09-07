import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmationComponent } from './shared/confirmation/confirmation.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmationComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {}
