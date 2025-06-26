import { Component, OnInit } from '@angular/core';
import { HalisLinkService, Link } from '../halis-link.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-link-list',
  imports: [CommonModule, FormsModule, InputTextModule],
  standalone: true,
  templateUrl: './link-list.component.html',
  styleUrl: './link-list.component.scss'
})
export class LinkListComponent implements OnInit {
  links: Link[] = [];
  types: string[] = [];
  query = '';

  constructor(
    private mdService: HalisLinkService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    /*
    if (!this.authService.isLoggedIn()) {
      alert('Veuillez vous connecter.');
      return;
    }
    console.log('User ID:', this.authService.getCurrentUserId());
    */
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const content = await file.text();
      this.mdService.parseMarkdown(content);
      this.types = this.mdService.getTypes();
      this.links = this.mdService.getLinks(this.authService.getCurrentUserId());
    }
  }

  search() {
    this.links = this.mdService.searchLinks(
      this.query,
      this.authService.getCurrentUserId()
    );
  }

  // searchLinks() déclenché à la saisie dans l'input de recherche
  searchLinks() {
    this.links = this.mdService.searchLinks(this.query, this.authService.getCurrentUserId());
  }

  // Filtre par type
  filterByType(type: string) {
    if (type) {
      this.links = this.mdService.filterByType(type, this.authService.getCurrentUserId());
    } else {
      this.links = this.mdService.getLinks(this.authService.getCurrentUserId());
    }
  }

  // Ouvre un lien dans un nouvel onglet
  openLink(url: string) {
    window.open(url, '_blank');
  }

  // Couleurs par type
  getColor(type: string): string {
    const colors: any = {
      Angular: '#dd0031',
      Symfony: '#000000',
      Snippets: '#ff8c00',
      librairies: '#28a745',
      documentation: '#007bff'
    };
    return colors[type] || '#cccccc';
  }


}
