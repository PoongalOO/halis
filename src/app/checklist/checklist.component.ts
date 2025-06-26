import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

interface ChecklistItem {
  title: string;
  checked: boolean;
  originalIndex: number;
  details: string[];
  checkTimestamp?: number;
}

@Component({
  selector: 'app-checklist',
  imports: [CommonModule, DialogModule, InputTextModule, ButtonModule],
  templateUrl: './checklist.component.html',
  styleUrl: './checklist.component.scss'
})
export class ChecklistComponent implements OnInit {
    mainTitle: string = '';
    items: ChecklistItem[] = [];
    showCompletionDialog: boolean = false;
    markdownContent: string = '';
  
    constructor() { }
  
    ngOnInit(): void {
      // Aucun fichier n'est chargé par défaut. L'utilisateur doit sélectionner un fichier Markdown.
    }
  
    onFileSelected(event: any): void {
      if (event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const content = e.target.result;
          // Réinitialisation de la checklist avant de charger un nouveau fichier
          this.markdownContent = '';
          this.items = [];
          this.mainTitle = '';
          this.loadMarkdown(content);
        };
        reader.readAsText(file);
      }
    }
  
    loadMarkdown(content: string) {
      this.markdownContent = content;
      const lines = content.split('\n');
      let itemIndex = 0;
      let currentItem: ChecklistItem | null = null;
      for (let line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('# ')) {
          // Définition du titre principal à partir d'une ligne commençant par "# "
          this.mainTitle = trimmedLine.substring(2).trim();
        } else if (trimmedLine.startsWith('## ')) {
          // Création d'un nouvel item de la checklist à partir d'une ligne commençant par "## "
          currentItem = {
            title: trimmedLine.substring(3).trim(),
            checked: false,
            originalIndex: itemIndex,
            details: []
          };
          this.items.push(currentItem);
          itemIndex++;
        } else if (trimmedLine.startsWith('- ')) {
          // Les lignes qui commencent par "-" sont ajoutées comme détails à l'item courant (s'il existe)
          if (currentItem) {
            currentItem.details.push(trimmedLine.substring(2).trim());
          }
        }
      }
    }
  
    // Renvoie le nombre total d'items
    get totalItems(): number {
      return this.items.length;
    }
  
    // Renvoie le nombre d'items non cochés
    get remainingItems(): number {
      return this.items.filter(item => !item.checked).length;
    }
  
    toggleItem(item: ChecklistItem) {
      item.checked = !item.checked;
      if (item.checked) {
        // On enregistre l'ordre de validation avec un timestamp
        item.checkTimestamp = Date.now();
      } else {
        // On supprime le timestamp pour rétablir l'ordre initial
        delete item.checkTimestamp;
      }
      this.sortItems();
  
      // Affiche la fenêtre de fin dès que tous les items sont cochés
      if (this.remainingItems === 0) {
        this.showCompletionDialog = true;
      }
    }
  
    // Les items non cochés restent dans l'ordre d'origine,
    // les items cochés se déplacent à la fin dans l'ordre de validation.
    sortItems() {
      this.items.sort((a, b) => {
        if (a.checked === b.checked) {
          if (!a.checked && !b.checked) {
            return a.originalIndex - b.originalIndex;
          } else {
            return (a.checkTimestamp || 0) - (b.checkTimestamp || 0);
          }
        }
        return a.checked ? 1 : -1;
      });
    }

    // Réinitialise la checklist : décoche tous les items et restaure l'ordre initial
  resetChecklist(): void {
    this.items.forEach(item => {
      item.checked = false;
      delete item.checkTimestamp;
    });
    // Rétablir l'ordre initial en triant par originalIndex
    this.items.sort((a, b) => a.originalIndex - b.originalIndex);
    this.showCompletionDialog = false;
  }
}
