import { Component } from '@angular/core';
import { AuthService } from './../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  loginError = '';

  constructor(private authService: AuthService) {}

  login() {
    if (this.authService.login(this.username, this.password)) {
      this.loginError = '';
      window.location.reload(); // ou navigue vers la page des liens
    } else {
      this.loginError = 'Identifiant ou mot de passe incorrect.';
    }
  }
}
