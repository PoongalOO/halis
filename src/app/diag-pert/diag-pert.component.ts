import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import mermaid from 'mermaid';
import { InputTextModule } from 'primeng/inputtext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Task {
  id: string;
  name: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  duration: number;      // Calculé avec la formule PERT
  predecessors: string[];
  successors?: string[];
  es?: number;           // Earliest Start
  ef?: number;           // Earliest Finish = es + duration
  ls?: number;           // Latest Start = lf - duration
  lf?: number;           // Latest Finish
  slack?: number;        // Marge = LS - ES (ou LF - EF)
  critical?: boolean;    // Tâche critique si marge == 0
}

@Component({
  selector: 'app-diag-pert',
  imports: [],
  templateUrl: './diag-pert.component.html',
  styleUrl: './diag-pert.component.scss'
})
export class DiagPertComponent {
  tasks: Task[] = [];
  zoomLevel: number = 1;

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const markdown = e.target.result;
        this.tasks = [];
        this.parseMarkdown(markdown);
        // Calcul de la durée avec la formule PERT
        this.tasks.forEach(task => {
          task.duration = (task.optimistic + 4 * task.mostLikely + task.pessimistic) / 6;
        });
        this.computeEventTimes();
        this.drawDiagram();
      };
      reader.readAsText(file);
    }
  }

  /**
   * Parse le fichier Markdown au format donné.
   * Chaque activité est définie par un titre de niveau 2 avec le format "ID - Nom"
   * suivi de lignes listant "Optimiste", "LaPlusProbable", "Pessimiste" et "Prédécesseurs".
   */
  private parseMarkdown(markdown: string): void {
    const lines = markdown.split('\n');
    let currentTask: Task | null = null;
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('## ')) {
        // Format attendu : "## A - Début"
        const heading = line.substring(3).trim();
        const parts = heading.split(' - ');
        if (parts.length >= 2) {
          currentTask = {
            id: parts[0].trim(),
            name: parts.slice(1).join(' - ').trim(),
            optimistic: 0,
            mostLikely: 0,
            pessimistic: 0,
            duration: 0,
            predecessors: []
          };
          this.tasks.push(currentTask);
        } else {
          currentTask = null;
        }
      } else if (line.startsWith('-') && currentTask) {
        const content = line.substring(1).trim();
        const colonIndex = content.indexOf(':');
        if (colonIndex !== -1) {
          const key = content.substring(0, colonIndex).trim().toLowerCase();
          const value = content.substring(colonIndex + 1).trim();
          if (key === 'optimiste') {
            currentTask.optimistic = Number(value);
          } else if (key === 'laplusprobable' || key === 'la plus probable') {
            currentTask.mostLikely = Number(value);
          } else if (key === 'pessimiste') {
            currentTask.pessimistic = Number(value);
          } else if (key === 'prédécesseurs' || key === 'predecesseurs') {
            currentTask.predecessors = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
          }
        }
      }
    }
  }

  /**
   * Calcule les temps au plus tôt (forward pass) puis au plus tard (backward pass),
   * calcule la marge (slack) et détermine le chemin critique (marge nulle).
   */
  private computeEventTimes(): void {
    // ----- Forward pass : calcul de ES et EF -----
    this.tasks.forEach(task => {
      if (task.predecessors.length === 0) {
        task.es = 0;
        task.ef = task.duration;
      }
    });

    let forwardChanged = true;
    while (forwardChanged) {
      forwardChanged = false;
      this.tasks.forEach(task => {
        if (task.predecessors.length > 0) {
          const preds = task.predecessors
            .map(pid => this.tasks.find(t => t.id === pid))
            .filter(t => t && t.ef !== undefined) as Task[];
          if (preds.length === task.predecessors.length) {
            const newES = Math.max(...preds.map(t => t.ef!));
            if (task.es === undefined || newES > task.es) {
              task.es = newES;
              task.ef = task.es + task.duration;
              forwardChanged = true;
            }
          }
        }
      });
    }

    // ----- Détermination des successeurs -----
    this.tasks.forEach(task => {
      task.successors = [];
    });
    this.tasks.forEach(task => {
      task.predecessors.forEach(predId => {
        const predTask = this.tasks.find(t => t.id === predId);
        if (predTask) {
          if (!predTask.successors) {
            predTask.successors = [];
          }
          predTask.successors.push(task.id);
        }
      });
    });

    // ----- Backward pass : calcul de LF et LS -----
    const projectDuration = Math.max(...this.tasks.map(task => task.ef || 0));
    this.tasks.forEach(task => {
      if (!task.successors || task.successors.length === 0) {
        task.lf = projectDuration;
        task.ls = task.lf - task.duration;
      }
    });

    let backwardChanged = true;
    while (backwardChanged) {
      backwardChanged = false;
      this.tasks.forEach(task => {
        if (task.successors && task.successors.length > 0) {
          const succTasks = task.successors
            .map(sid => this.tasks.find(t => t.id === sid))
            .filter(t => t && t.ls !== undefined) as Task[];
          if (succTasks.length === task.successors.length) {
            const newLF = Math.min(...succTasks.map(t => t.ls!));
            if (task.lf === undefined || newLF < task.lf) {
              task.lf = newLF;
              task.ls = task.lf - task.duration;
              backwardChanged = true;
            }
          }
        }
      });
    }

    // ----- Calcul des marges (slack) et détermination du chemin critique -----
    this.tasks.forEach(task => {
      if (task.es !== undefined && task.ls !== undefined) {
        task.slack = task.ls - task.es;
        task.critical = Math.abs(task.slack) < 1e-6; // tolérance numérique
      }
    });
  }

  /**
   * Génère le diagramme PERT avec Mermaid.
   * Chaque nœud représente un événement (la valeur de temps) et chaque arc représente une activité,
   * avec comme étiquette : ID, nom, durée, ES/EF, LS/LF et marge.
   * Pour se rapprocher du diagramme fourni :
   *   - Les nœuds sont affichés sous forme de cercles (double parenthèse).
   *   - Les arcs critiques sont dessinés avec une flèche épaisse (==>) tandis que les autres utilisent "-->".
   */

  private async drawDiagram(): Promise<void> {
    // Rassembler toutes les valeurs d'événements (ES et EF) pour créer les nœuds
    const eventTimes = new Set<number>();
    this.tasks.forEach(task => {
      if (task.es !== undefined) eventTimes.add(task.es);
      if (task.ef !== undefined) eventTimes.add(task.ef);
    });
    const sortedEvents = Array.from(eventTimes).sort((a, b) => a - b);
    // Associer chaque valeur d'événement à un identifiant de nœud (E0, E1, …)
    const eventNodes = new Map<number, string>();
    sortedEvents.forEach((time, index) => {
      eventNodes.set(time, `E${index}`);
    });
  
    // On va construire la définition du diagramme et accumuler les commandes de style
    let diagramDefinition = 'flowchart LR\n';
    let arcsText = ''; // contient la définition des arcs
    const linkStyles: string[] = [];
    let arcIndex = 0; // indice pour chaque arc
  
    // Création des nœuds d'événements sous forme de cercles
    eventNodes.forEach((nodeId, time) => {
      diagramDefinition += `  ${nodeId}((${time.toFixed(1)}))\n`;
    });
  
    // Pour chaque tâche, ajouter les arcs dummy puis l'arc réel
    this.tasks.forEach(task => {
      if (task.es !== undefined && task.ef !== undefined) {
        if (task.predecessors.length > 0) {
          // Trouver le prédécesseur principal : celui dont l'EF est égal à task.es (tolérance)
          let mainPred: Task | undefined = undefined;
          task.predecessors.forEach(predId => {
            const predTask = this.tasks.find(t => t.id === predId);
            if (predTask && predTask.ef !== undefined) {
              if (Math.abs(predTask.ef - task.es!) < 1e-6) {
                mainPred = predTask;
              }
            }
          });
          // Si aucun n'est trouvé, on prend le premier de la liste
          if (!mainPred && task.predecessors.length > 0) {
            mainPred = this.tasks.find(t => t.id === task.predecessors[0]);
          }
          // Pour chaque prédécesseur différent du principal, ajouter un arc dummy si nécessaire
          task.predecessors.forEach(predId => {
            const predTask = this.tasks.find(t => t.id === predId);
            if (predTask && predTask.ef !== undefined) {
              if (!mainPred || predTask.id !== mainPred.id) {
                if (Math.abs(predTask.ef - task.es!) > 1e-6) {
                  const startNode = eventNodes.get(predTask.ef!);
                  const endNode = eventNodes.get(task.es!);
                  if (startNode && endNode) {
                    // Arc dummy (trait pointillé, sans label)
                    arcsText += `  ${startNode} ---|dummy| ${endNode}\n`;
                    linkStyles.push(`linkStyle ${arcIndex} stroke:#999,stroke-dasharray:5,5,stroke-width:1px;`);
                    arcIndex++;
                  }
                }
              }
            }
          });
          // Arc réel pour l'activité
          const startNode = eventNodes.get(task.es!);
          const endNode = eventNodes.get(task.ef!);
          if (startNode && endNode) {
            const label = `${task.id}: ${task.name}<br>D: ${task.duration.toFixed(1)}<br>ES: ${task.es!.toFixed(1)} EF: ${task.ef!.toFixed(1)}<br>LS: ${task.ls?.toFixed(1)} LF: ${task.lf?.toFixed(1)}<br>Slack: ${task.slack?.toFixed(1)}${task.critical ? ' *' : ''}`;
            arcsText += `  ${startNode} -->|${label}| ${endNode}\n`;
            // Si l'activité est critique, couleur rouge et trait épais, sinon bleu normal
            if (task.critical) {
              linkStyles.push(`linkStyle ${arcIndex} stroke:#f66,stroke-width:2px;`);
            } else {
              linkStyles.push(`linkStyle ${arcIndex} stroke:#333,stroke-width:1px;`);
            }
            arcIndex++;
          }
        } else {
          // Tâches sans prédécesseurs : arc direct
          const startNode = eventNodes.get(task.es!);
          const endNode = eventNodes.get(task.ef!);
          if (startNode && endNode) {
            const label = `${task.id}: ${task.name}<br>D: ${task.duration.toFixed(1)}<br>ES: ${task.es!.toFixed(1)} EF: ${task.ef!.toFixed(1)}<br>LS: ${task.ls?.toFixed(1)} LF: ${task.lf?.toFixed(1)}<br>Slack: ${task.slack?.toFixed(1)}${task.critical ? ' *' : ''}`;
            arcsText += `  ${startNode} -->|${label}| ${endNode}\n`;
            linkStyles.push(`linkStyle ${arcIndex} stroke:#333,stroke-width:1px;`);
            arcIndex++;
          }
        }
      }
    });
  
    // Ajouter les arcs et les styles à la définition
    diagramDefinition += arcsText + "\n" + linkStyles.join("\n") + "\n";
  
    // Initialisation et rendu du diagramme
    mermaid.initialize({ startOnLoad: false });
    try {
      const renderResult = await mermaid.render('mermaidId', diagramDefinition);
      const container = document.getElementById('pertDiagram');
      if (container) {
        container.innerHTML = renderResult.svg;
      }
    } catch (error) {
      console.error('Erreur lors du rendu du diagramme:', error);
    }
  }
  
  exportAsPNG(): void {
    const element = document.getElementById('pertDiagram');
    if (element) {
      html2canvas(element).then(canvas => {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'pert-diagram.png';
        link.click();
      });
    }
  }

  exportAsPDF(): void {
    const element = document.getElementById('pertDiagram');
    if (element) {
      html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('pert-diagram.pdf');
      });
    }
  }

  zoomIn(): void {
    this.zoomLevel += 0.1;
    this.applyZoom();
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.2) {
      this.zoomLevel -= 0.1;
      this.applyZoom();
    }
  }

  applyZoom(): void {
    const container = document.getElementById('pertDiagram');
    if (container) {
      container.style.transform = `scale(${this.zoomLevel})`;
      container.style.transformOrigin = '0 0';
    }
  }

}
