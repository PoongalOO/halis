import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { CountdownComponent, CountdownConfig, CountdownModule } from 'ngx-countdown';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MarkdownModule } from 'ngx-markdown';

interface TimerItem {
  type: 'pomodoro' | 'shortBreak' | 'longBreak';
  title?: string; // pour les pomodori
  content?: string;       // contenu associé au pomodoro
  duration: number; // en secondes
  remainingTime?: number; // temps restant mis à jour en temps réel
}


@Component({
  selector: 'app-pomodoro',
  imports: [
    CommonModule,
    CountdownModule,
    CountdownModule,
    DialogModule,
    ButtonModule,
    MarkdownModule
  ],
  templateUrl: './pomodoro.component.html',
  styleUrl: './pomodoro.component.scss'
})
export class PomodoroComponent {
  @ViewChild('activeCountdown', { static: false }) activeCountdown!: CountdownComponent;

  timeline: TimerItem[] = [];
  currentIndex: number = -1;
  config: CountdownConfig = { leftTime: 1500, format: 'mm:ss' };

  isPaused = false;
  isRunning = false;
  markdownContent: string = '';

  // Propriétés pour la confirmation PrimeNG
  globalTitle: string = '';
  confirmDisplay: boolean = false;
  confirmMessage: string = '';
  confirmCallback: (() => void) | null = null;

  // Getter qui calcule le temps total des pomodori (en secondes)
  get totalPomodoroTime(): number {
    return this.timeline
      .filter(item => item.type === 'pomodoro')
      .reduce((acc, item) => acc + item.duration, 0);
  }

  // Méthode de formatage du temps total (ex. "1h 15m")
  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    } else {
      return `${m}m`;
    }
  }
  showConfirmation(message: string, callback: () => void) {
    this.confirmMessage = message;
    this.confirmCallback = callback;
    this.confirmDisplay = true;
  }

  onConfirm() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.confirmDisplay = false;
  }

  onReject() {
    this.confirmDisplay = false;
    // On arrête la séquence si la confirmation est rejetée
    this.isRunning = false;
  }

  // Chargement du Markdown
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) { return; }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.markdownContent = e.target.result;
      this.parseMarkdown();
    };
    reader.readAsText(file);
  }

  // Parse le Markdown pour créer la timeline avec pomodori et pauses
  parseMarkdown() {
    this.timeline = [];
    this.globalTitle = '';
    const lines = this.markdownContent.split('\n');

    // Extraction du titre de niveau 1 (global) : la première ligne commençant par "# " et non "##"
    for (const line of lines) {
      if (line.startsWith('# ') && !line.startsWith('##')) {
        this.globalTitle = line.replace(/^#\s*/, '').trim();
        break;
      }
    }

    const pomodoroItems: TimerItem[] = [];
    let currentTitle = '';
    let currentContent = '';

    // Parcours ligne par ligne
    lines.forEach(line => {
      if (line.startsWith('##')) {
        // Si un titre est déjà en cours, on le pousse dans la liste
        if (currentTitle) {
          pomodoroItems.push({
            type: 'pomodoro',
            title: currentTitle,
            content: currentContent.trim(),
            duration: 1500,
            remainingTime: 1500
          });
        }
        currentTitle = line.replace(/^##\s*/, '').trim();
        currentContent = '';
      } else {
        // Ajout de la ligne au contenu courant
        currentContent += line + '\n';
      }
    });
    // Pousser le dernier pomodoro
    if (currentTitle) {
      pomodoroItems.push({
        type: 'pomodoro',
        title: currentTitle,
        content: currentContent.trim(),
        duration: 1500,
        remainingTime: 1500
      });
    }

    // Création de la timeline avec insertion automatique de pauses entre pomodori
    pomodoroItems.forEach((item, index) => {
      this.timeline.push(item);
      if (index < pomodoroItems.length - 1) {
        // Après 4 pomodori, pause longue de 15 minutes, sinon pause courte de 5 minutes
        if ((index + 1) % 4 === 0) {
          this.timeline.push({ type: 'longBreak', duration: 900, remainingTime: 900 });
        } else {
          this.timeline.push({ type: 'shortBreak', duration: 300, remainingTime: 300 });
        }
      }
    });
    this.currentIndex = -1;
    this.isRunning = false;
  }

  // Démarre la séquence à partir d'un index donné (0 par défaut)
  startSequence(startIndex: number = 0) {
    if (this.timeline.length === 0) {
      alert('Veuillez d’abord charger un fichier Markdown contenant vos pomodori.');
      return;
    }
    this.currentIndex = startIndex;
    this.launchCurrentItem();
  }

  // Lance l'item courant avec confirmation
  launchCurrentItem() {
    if (this.currentIndex < 0 || this.currentIndex >= this.timeline.length) {
      alert('Séquence terminée.');
      this.isRunning = false;
      return;
    }
    const currentItem = this.timeline[this.currentIndex];
    let confirmMessage = '';
    if (currentItem.type === 'pomodoro') {
      confirmMessage = `Prêt pour le pomodoro "${currentItem.title}" ?`;
    } else if (currentItem.type === 'shortBreak') {
      confirmMessage = 'Prêt pour la pause courte ?';
    } else if (currentItem.type === 'longBreak') {
      confirmMessage = 'Prêt pour la pause longue ?';
    }
    this.showConfirmation(confirmMessage, () => {
      // Réinitialisation du temps restant et mise à jour de la config du timer
      currentItem.remainingTime = currentItem.duration;
      this.config = { leftTime: currentItem.duration, format: 'mm:ss' };
      this.isRunning = true;
      // Le composant countdown dans le li actif sera recréé lors du changement de template.
    });
  }

  // Formatage du temps en mm:ss
  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${('0' + m).slice(-2)}:${('0' + s).slice(-2)}`;
  }

  // Gestion des événements du countdown
  handleEvent(event: any) {
    if (event.action === 'notify') {
      if (this.currentIndex >= 0 && this.currentIndex < this.timeline.length) {
        this.timeline[this.currentIndex].remainingTime = event.left;
      }
    }
    if (event.action === 'done') {
      this.showConfirmation('L\'étape est terminée. Validez pour passer à la suivante.', () => {
        this.nextItem();
      });
    }
  }

  nextItem() {
    this.currentIndex++;
    this.launchCurrentItem();
  }

  togglePause() {
    if (!this.isRunning) { return; }
    if (this.activeCountdown) {
      if (this.isPaused) {
        this.activeCountdown.resume();
      } else {
        this.activeCountdown.pause();
      }
      this.isPaused = !this.isPaused;
    }
  }
}
