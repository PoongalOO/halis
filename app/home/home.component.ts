import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-home',
  imports: [ButtonModule, CarouselModule, TagModule, CommonModule, CardModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  responsiveOptions: any[] | undefined;
  outils: any[] = [];
  activeComponent: string = 'home'; // Définit le composant actif par défaut
  buttonBarVisible: boolean = false;

  ngOnInit() {
    this.outils = [
      {
        name: "Diaporama",
        desc: "Créer des diaporamas à partir de fichiers Markdown",
        library: "Marp",
        urllib: "https://marp.app/",
        img: "assets/marp.png",
        link: "diaporama"
      },
      {
        name: "Carte mentale",
        desc: "Créer des cartes mentales à partir de fichiers Markdown",
        library: "Markmap",
        urllib: "https://markmapjs.com/",
        img: "assets/markmap.png",
        link: "markmap",
      },
      {
        name: "Editeur",
        desc: "Editeur de Markdown",
        library: "EasyMD",
        urllib: "https://github.com/Ionaru/easy-markdown-editor",
        img: "assets/easymd.png",
        link: "editeurmd",
      },
      {
        name: "Liens",
        desc : "Visualiser et exploiter vos liens à partir de fichiers Markdown",
        library: "Développement",
        urllib: "#",
        img: "assets/logo.png",
        link: "links",
      },
      {
        name: "Quiz",
        desc : "Créer des quiz à partir de fichiers Markdown",
        library: "Développement",
        urllib: "#",
        img: "assets/logo.png",
        link: "quiz",
      },
      {
        name: "Diagrammes",
        desc: "Créer des diagrammes à partir de fichiers Markdown",
        library: "Mermaid",
        urllib: "https://mermaid.js.org/",
        img: "assets/mermaid.png",
        link: "mermaid-diagram",
      },
      {
        name: "Pomodoro",
        desc : "Gérer votre temps à partir de fichiers Markdown",
        library: "Développement",
        urllib: "#",
        img: "assets/logo.png",
        link: "pomodoro",
      },
      {
        name: "Checklist",
        desc : "Créer des checklists types à partir de fichiers Markdown",
        library: "Développement",
        urllib: "#",
        img: "assets/logo.png",
        link: "checklit",
      },
      {
        name: "Xmind -> Markdown",
        desc : "Convertir des fichiers Xmind en Markdown",
        library: "Développement",
        urllib: "#",
        img: "assets/logo.png",
        link: "xmind-to-md",
      },
      {
        name: "Diagramme de PERT",
        desc : "Créer des diagrammes de PERT à partir de fichiers Markdown",
        library: "Développement",
        urllib: "#",
        img: "assets/logo.png",
        link: "diag-pert",
      },
      {
        name: "Graphiques",
        desc : "Aide pour afficher vos fichiers Markdown sous forme de graphiques",
        library: "Chart.js",
        urllib: "https://www.chartjs.org/",
        img: "assets/chartjs-logo.svg",
        link: "chart-generator",
      },
      {
        name: "Documentation",
        desc : "Aide pour formatter vos fichiers Markdown",
        library: "Développement",
        urllib: "#",
        img: "assets/logo.png",
        link: "documentation",
      },
      {
        name: "Vector Collections",
        desc : "Free All SVG Vectors and Icons.",
        library: "SVG et Icônes",
        urllib: "https://www.svgrepo.com/collections/",
        img: "assets/svgrepo.svg",
        link: "documentation",
      }
      
    ]

    this.responsiveOptions = [
        {
            breakpoint: '1400px',
            numVisible: 2,
            numScroll: 1
        },
        {
            breakpoint: '1199px',
            numVisible: 3,
            numScroll: 1
        },
        {
            breakpoint: '767px',
            numVisible: 2,
            numScroll: 1
        },
        {
            breakpoint: '575px',
            numVisible: 1,
            numScroll: 1
        }
    ]
  }

  getSeverity(status: string) {
    switch (status) {
        case 'INSTOCK':
            return 'success';
        case 'LOWSTOCK':
            return 'warn';
        case 'OUTOFSTOCK':
            return 'danger';
        default:
            return 'secondary';
    }
  }

  setActiveComponent(component: string): void {
    this.activeComponent = component;
    this.buttonBarVisible = false;
  }

}
