import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DiaporamaComponent } from "./diaporama/diaporama.component";
import { MarkmapComponent } from "./markmap/markmap.component";
import { QuizComponent } from './quiz/quiz.component';
import { CommonModule } from '@angular/common';
import { EditeurmdComponent } from "./editeurmd/editeurmd.component";
import { LinkListComponent } from "./link-list/link-list.component";
import { HomeComponent } from "./home/home.component";
import { MermaidDiagramComponent } from "./mermaid-diagram/mermaid-diagram.component";
import { PomodoroComponent } from "./pomodoro/pomodoro.component";
import { ChecklistComponent } from "./checklist/checklist.component";
import { DocumentationComponent } from "./documentation/documentation.component";
import { DiagPertComponent } from "./diag-pert/diag-pert.component";
import { FooterComponent } from "./footer/footer.component";
import { XmindToMdComponent } from "./xmind-to-md/xmind-to-md.component";
import { ChartGeneratorComponent } from "./chart-generator/chart-generator.component";
import { GojsDiagramComponent } from "./gojs-diagram/gojs-diagram.component";

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    MarkmapComponent,
    DiaporamaComponent,
    QuizComponent,
    EditeurmdComponent,
    LinkListComponent,
    HomeComponent,
    MermaidDiagramComponent,
    PomodoroComponent,
    ChecklistComponent,
    DocumentationComponent,
    DiagPertComponent,
    FooterComponent,
    XmindToMdComponent,
    ChartGeneratorComponent,
    GojsDiagramComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  activeComponent: string = 'home'; // Définit le composant actif par défaut
  buttonBarVisible: boolean = false;
  showDocumentation: boolean = false;

  setActiveComponent(component: string): void {
    this.activeComponent = component;
    this.buttonBarVisible = false;
  }

  toggleButtonBar() {
    this.buttonBarVisible = !this.buttonBarVisible;
  }

  toggleDocumentation(): void {
    this.showDocumentation = !this.showDocumentation;
  }
}
