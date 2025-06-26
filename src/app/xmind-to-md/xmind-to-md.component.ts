import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-xmind-to-md',
  imports: [CommonModule, ButtonModule],
  templateUrl: './xmind-to-md.component.html',
  styleUrl: './xmind-to-md.component.scss'
})
export class XmindToMdComponent {
  markdown: string = '';

  // Gestion de la sélection du fichier JSON
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          this.markdown = this.convertXmindJsonToMarkdown(json);
        } catch (err) {
          console.error('Erreur lors du parsing du JSON :', err);
          this.markdown = 'Erreur lors du parsing du JSON.';
        }
      };
      reader.readAsText(file);
    }
  }

  // Conversion du JSON XMind en Markdown
  convertXmindJsonToMarkdown(json: any): string {
    if (!json || !Array.isArray(json) || json.length === 0) {
      return 'Données non conformes.';
    }
    const sheet = json[0];
    if (!sheet.rootTopic) {
      return 'Données non conformes.';
    }
    const root = sheet.rootTopic;
    return this.processTopic(root, 0);
  }

  // Fonction récursive pour parcourir les sujets et générer le Markdown avec des niveaux de titre
  processTopic(topic: any, level: number): string {
    // Définition du niveau de titre : racine = #, enfant = ##, et pour tous les autres niveaux, on utilise -
    let heading = '';
    if (level === 0) {
      heading = '#';
    } else if (level === 1) {
      heading = '##';
    } else {
      heading = '-';
    }
    let md = `${heading} ${topic.title || 'Sans titre'}\n\n`;

    // Parcours des sujets enfants (stockés dans topic.children.attached)
    if (topic.children && topic.children.attached && topic.children.attached.length > 0) {
      topic.children.attached.forEach((child: any) => {
        md += this.processTopic(child, level + 1);
      });
    }
    return md;
  }

  // Téléchargement du résultat Markdown
  downloadMarkdown(): void {
    const blob = new Blob([this.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.md';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
