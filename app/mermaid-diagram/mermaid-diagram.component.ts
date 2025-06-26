import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import mermaid from 'mermaid';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-mermaid-diagram',
  imports: [CommonModule, FormsModule, InputTextModule],
  templateUrl: './mermaid-diagram.component.html',
  styleUrl: './mermaid-diagram.component.scss'
})
export class MermaidDiagramComponent implements AfterViewInit {
  @ViewChild('diagramContainer', { static: false }) diagramContainer!: ElementRef;
  diagramDefinition = '';
  diagramType = '';
  showDocumentation = false;

  constructor() {
    // Initialisez Mermaid une seule fois
    mermaid.initialize({ startOnLoad: false });
  }

  ngAfterViewInit(): void {
    // Si le diagramme est déjà chargé, on le rend
    if (this.diagramDefinition) {
      this.renderDiagram();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result as string;
        this.diagramDefinition = content;
        this.diagramType = this.detectDiagramType(content);
        // Après avoir chargé le contenu, déclencher le rendu
        setTimeout(() => this.renderDiagram(), 0);
      };
      reader.readAsText(file);
    }
  }

  // Fonction simple pour détecter le type de diagramme
  detectDiagramType(content: string): string {
    if (/^\s*graph\s+(TD|LR)/m.test(content)) {
      return 'Flowchart';
    } else if (/^\s*sequenceDiagram/m.test(content)) {
      return 'Sequence Diagram';
    } else if (/^\s*gantt/m.test(content)) {
      return 'Gantt Diagram';
    } else if (/^\s*classDiagram/m.test(content)) {
      return 'Class Diagram';
    } else if (/^\s*timeline/m.test(content)) {
      return 'Timeline Diagram';
    }
    return 'Type inconnu';
  }

  // Fonction pour rendre le diagramme dans le conteneur
  async renderDiagram(): Promise<void> {
    if (this.diagramContainer && this.diagramDefinition) {
      // Effacez le contenu existant
      this.diagramContainer.nativeElement.innerHTML = '';
      try {
        const uniqueId = 'mermaid-' + Date.now();
        // Laissez Mermaid générer le SVG sans fournir de conteneur
        const { svg, bindFunctions } = await mermaid.render(uniqueId, this.diagramDefinition);
        // Injectez le SVG généré dans votre conteneur (par exemple une div)
        this.diagramContainer.nativeElement.innerHTML = svg;
        // Appliquez les fonctions de liaison si nécessaire
        if (bindFunctions) {
          // Note : bindFunctions peut nécessiter l'élément contenant le SVG.
          bindFunctions(this.diagramContainer.nativeElement);
        }
      } catch (error) {
        console.error('Erreur lors du rendu du diagramme Mermaid :', error);
      }
    }
  }
  
  toggleDocumentation(): void {
    this.showDocumentation = !this.showDocumentation;
  }
  
}
