import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import EasyMDE from 'easymde';
import { marked } from 'marked';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-editeurmd',
  imports: [InputTextModule],
  templateUrl: './editeurmd.component.html',
  styleUrls: ['./editeurmd.component.scss']
})
export class EditeurmdComponent implements AfterViewInit {
  public markdownContent: string = '';
  public previewContent: string = '';
  private easyMDE!: EasyMDE;

  @ViewChild('editor') editorRef!: ElementRef;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  ngAfterViewInit() {
    if (!this.editorRef) {
      console.error("L'élément éditeur est introuvable dans le template.");
      return;
    }

    this.easyMDE = new EasyMDE({
      element: this.editorRef.nativeElement,
      autoDownloadFontAwesome: true,
      spellChecker: false,
    });

    // Attendre un cycle pour s'assurer que codemirror est bien initialisé
    setTimeout(() => {
      if (this.easyMDE.codemirror) {
        this.easyMDE.codemirror.on('change', () => {
          this.markdownContent = this.easyMDE.value();
          this.updatePreview();
        });
      } else {
        console.error("La propriété codemirror n'est pas disponible");
      }
    }, 0);

    // Initialisation de la prévisualisation
    this.markdownContent = this.easyMDE.value();
    this.updatePreview();
  }

  // Fonction asynchrone pour mettre à jour la prévisualisation
  async updatePreview() {
    this.previewContent = await marked.parse(this.markdownContent);
  }

  // Charger un fichier Markdown et mettre à jour l’éditeur
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        this.markdownContent = reader.result as string;
        this.easyMDE.value(this.markdownContent);
        await this.updatePreview();
      };
      reader.readAsText(file);
    }
  }

  // Enregistrer le contenu actuel dans un fichier .md
  saveFile() {
    const blob = new Blob([this.markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
