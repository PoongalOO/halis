import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { jsPDF } from 'jspdf';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-chart-generator',
  imports: [CommonModule, InputTextModule],
  templateUrl: './chart-generator.component.html',
  styleUrl: './chart-generator.component.scss'
})
export class ChartGeneratorComponent {
  chart: Chart | undefined;
  chartTitle: string = '';

  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef;

  // Chargement du fichier Markdown
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        this.parseMarkdown(fileContent);
      };
      reader.readAsText(file);
    }
  }

  /**
   * Analyse le fichier Markdown selon la structure suivante :
   *
   * # Titre du graphique
   *
   * - Type: bar
   * - indexAxis: y
   * - animationDuration: 1000
   *
   * ## Libellé 1
   * - Dataset: 80
   *
   * ## Libellé 2
   * - Dataset: 10
   *
   * Chaque section de niveau 2 correspond à un label et une valeur numérique
   * (pour un graphique scatter, la valeur doit être au format (x,y)).
   */
  parseMarkdown(content: string) {
    const lines = content.split('\n');
    let title = '';
    const globalSettings: { [key: string]: string } = {};
    const datasetSections: { label: string, datasetValue: string }[] = [];
    let i = 0;

    // Récupération du titre (première ligne de niveau 1)
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith('# ') && !line.startsWith('##')) {
        title = line.replace(/^#\s*/, '').trim();
        i++;
        break;
      }
      i++;
    }

    // Lecture des réglages globaux (lignes en liste avant la première section)
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith('##')) {
        break;
      }
      if (line.startsWith('-')) {
        // Format attendu : "- Clé: Valeur"
        const match = line.match(/-\s*(.+?):\s*(.+)/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          globalSettings[key] = value;
        }
      }
      i++;
    }

    // Lecture des sections de dataset
    while (i < lines.length) {
      let line = lines[i].trim();
      if (line.startsWith('##')) {
        // Le titre de la section est utilisé comme label
        const sectionLabel = line.replace(/^##\s*/, '').trim();
        let datasetValue = '';
        i++;
        // Parcours de la section jusqu'à la prochaine ou la fin du fichier
        while (i < lines.length && !lines[i].trim().startsWith('##')) {
          line = lines[i].trim();
          if (line.startsWith('-')) {
            const match = line.match(/-\s*Dataset:\s*(.+)/i);
            if (match) {
              datasetValue = match[1].trim();
            }
          }
          i++;
        }
        if (datasetValue !== '') {
          datasetSections.push({ label: sectionLabel, datasetValue });
        }
      } else {
        i++;
      }
    }

    // Construction de l'objet de configuration pour Chart.js
    const config: any = {};

    // Le type de graphique est défini dans les réglages globaux (clé "Type")
    if (globalSettings['Type']) {
      // On conserve la casse pour correspondre aux noms enregistrés dans Chart.js
      config.type = globalSettings['Type'].trim();
    } else {
      console.error("La configuration globale doit comporter une clé 'Type'.");
      return;
    }

    // Création de data en fonction du type
    if (config.type === 'scatter') {
      // Les scatter charts n'utilisent pas de tableau de labels
      config.data = {};
      config.data.datasets = [{
        label: 'Dataset',
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1
      }];
    } else {
      config.data = {};
      config.data.labels = [];
      config.data.datasets = [{
        label: 'Dataset',
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1
      }];
    }

    // Remplissage des données à partir des sections
    datasetSections.forEach(section => {
      if (config.type === 'scatter') {
        // Attente d'une valeur au format (x,y) sans ajouter de label dans data.labels
        const value = section.datasetValue;
        const pairMatch = value.match(/\(?\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)?/);
        if (pairMatch) {
          const x = Number(pairMatch[1]);
          const y = Number(pairMatch[2]);
          config.data.datasets[0].data.push({ x, y });
        }
      } else {
        const num = Number(section.datasetValue);
        config.data.labels.push(section.label);
        config.data.datasets[0].data.push(num);
      }
    });

    // Configuration des options globales
    config.options = { animation: {} };
    Object.keys(globalSettings).forEach(key => {
      if (key.toLowerCase() === 'type') {
        // Déjà géré
      } else if (key.toLowerCase() === 'animationduration') {
        config.options.animation.duration = Number(globalSettings[key]);
      } else {
        // Exemple : indexAxis, etc.
        const numVal = Number(globalSettings[key]);
        config.options[key] = isNaN(numVal) ? globalSettings[key] : numVal;
      }
    });

    // Ajout des plugins par défaut
    if (!config.options.plugins) {
      config.options.plugins = {};
    }
    config.options.plugins.title = {
      display: true,
      text: title
    };
    if (!config.options.plugins.legend) {
      config.options.plugins.legend = { display: true };
    }
    if (!config.options.plugins.tooltip) {
      config.options.plugins.tooltip = { enabled: true };
    }

    // Génération des couleurs par défaut
    const dataLength = (config.type === 'scatter')
      ? config.data.datasets[0].data.length
      : config.data.labels.length;
    config.data.datasets[0].backgroundColor = this.generateColors(dataLength, 0.6);
    config.data.datasets[0].borderColor = this.generateColors(dataLength, 1);

    this.chartTitle = title;
    this.renderChart(config);
  }

  // Affichage du graphique sur le canvas
  renderChart(config: any) {
    if (this.chart) {
      this.chart.destroy();
    }
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, config);
  }

  // Génère une liste de couleurs par défaut
  generateColors(count: number, opacity: number): string[] {
    const colors = [
      `rgba(255, 99, 132, ${opacity})`,
      `rgba(54, 162, 235, ${opacity})`,
      `rgba(255, 206, 86, ${opacity})`,
      `rgba(75, 192, 192, ${opacity})`,
      `rgba(153, 102, 255, ${opacity})`,
      `rgba(255, 159, 64, ${opacity})`
    ];
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }
  
  // Méthode de zoom avant en modifiant les bornes de chaque axe (si définies)
  zoomIn() {
    if (!this.chart) { return; }
    Object.keys(this.chart.scales).forEach(scaleId => {
      const scale = this.chart?.scales[scaleId];
      if (!scale) { return; }
      // Vérifier que les bornes min et max sont bien définies et sont des nombres
      if (typeof scale.min === 'number' && typeof scale.max === 'number') {
        const currentMin = scale.min;
        const currentMax = scale.max;
        const center = (currentMin + currentMax) / 2;
        const newRange = (currentMax - currentMin) / 1.1;
        const newMin = center - newRange / 2;
        const newMax = center + newRange / 2;
        // On stocke ces valeurs dans les options pour les conserver
        scale.options.min = newMin;
        scale.options.max = newMax;
      }
    });
    this.chart.update();
  }
  

  // Méthode de zoom arrière en élargissant la plage de chaque axe
  zoomOut() {
    if (!this.chart) { return; }
    Object.keys(this.chart.scales).forEach(scaleId => {
      const scale = this.chart?.scales[scaleId];
      if (!scale) { return; }
      if (typeof scale.min === 'number' && typeof scale.max === 'number') {
        const currentMin = scale.min;
        const currentMax = scale.max;
        const center = (currentMin + currentMax) / 2;
        const newRange = (currentMax - currentMin) * 1.1;
        const newMin = center - newRange / 2;
        const newMax = center + newRange / 2;
        scale.options.min = newMin;
        scale.options.max = newMax;
      }
    });
    this.chart.update();
  }
  

  // Export le graphique en PNG en téléchargeant le canvas
  printPNG() {
    if (!this.chart) { return; }
    const canvas = this.chartCanvas.nativeElement;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'chart.png';
    link.click();
  }

  // Export le graphique en PDF en utilisant jsPDF
  printPDF() {
    if (!this.chart) { return; }
    const canvas = this.chartCanvas.nativeElement;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('chart.pdf');
  }

  // Basculer l'affichage en plein écran pour le conteneur du graphique
  toggleFullScreen() {
    const chartContainer = this.chartCanvas.nativeElement.parentNode;
    if (!document.fullscreenElement) {
      chartContainer.requestFullscreen().catch((err: any) => {
        console.error(`Erreur lors du passage en mode plein écran : ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // Agrandir le graphique en augmentant la largeur du conteneur
  enlargeChart() {
    const chartContainer = this.chartCanvas.nativeElement.parentNode;
    const currentWidth = chartContainer.offsetWidth;
    const newWidth = currentWidth * 1.1;
    chartContainer.style.width = newWidth + 'px';
    if (this.chart) {
      this.chart.resize();
    }
  }

  // Diminuer le graphique en réduisant la largeur du conteneur
  shrinkChart() {
    const chartContainer = this.chartCanvas.nativeElement.parentNode;
    const currentWidth = chartContainer.offsetWidth;
    const newWidth = currentWidth * 0.9;
    chartContainer.style.width = newWidth + 'px';
    if (this.chart) {
      this.chart.resize();
    }
  }
}
