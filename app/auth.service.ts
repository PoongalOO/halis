import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Simule une liste d'utilisateurs prédéfinie
  private users = [
    { userId: 'user123', username: 'Samuel', password: 'password1' },
    { userId: 'user456', username: 'bob', password: 'password2' }
  ];

  private currentUserId: string | null = null;

  constructor() {
    this.currentUserId = localStorage.getItem('currentUserId');
  }

  // Méthode pour tenter une connexion
  login(username: string, password: string): boolean {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      this.currentUserId = user.userId;
      localStorage.setItem('currentUserId', user.userId);
      return true;
    }
    return false;
  }

  // Méthode de déconnexion
  logout() {
    this.currentUserId = null;
    localStorage.removeItem('currentUserId');
  }

  // Vérifie si un utilisateur est connecté
  isLoggedIn(): boolean {
    return !!this.currentUserId;
  }

  // Récupère l'ID de l'utilisateur connecté
  getCurrentUserId(): string | undefined {
    return this.currentUserId || undefined;
  }
  
}
