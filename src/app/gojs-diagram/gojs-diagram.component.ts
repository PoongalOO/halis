import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import * as go from 'gojs';
import { InputTextModule } from 'primeng/inputtext';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-gojs-diagram',
  imports: [CommonModule, InputTextModule],
  templateUrl: './gojs-diagram.component.html',
  styleUrl: './gojs-diagram.component.scss'
})
export class GojsDiagramComponent {
  @ViewChild('diagramContainer', { static: false }) diagramContainer!: ElementRef;
  diagrams: { type: string, content: string, divId: string }[] = [];
  diagramCounter = 0;
  currentDiagram: go.Diagram | null = null;

  ngAfterViewInit() {
    // Actions post-rendu éventuelles
  }

  onFileSelected(event: any) {
    // Réinitialiser les diagrammes et le compteur afin de remplacer l'affichage précédent
    this.diagrams = [];
    this.diagramCounter = 0;
    
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const markdownText = e.target.result;
        this.processMarkdown(markdownText);
      };
      reader.readAsText(file);
    }
  }

  // Traitement du fichier Markdown sans utiliser de backticks.
  // Chaque nouveau diagramme démarre à la ligne commençant par "#type:"
  processMarkdown(markdown: string) {
    const lines = markdown.split('\n');
    const blocks: { diagramType: string, blockContent: string }[] = [];
    let currentType: string = "flowchart"; // type par défaut
    let currentBlock: string[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      if (line.toLowerCase().startsWith("#type:")) {
        if (currentBlock.length > 0) {
          blocks.push({ diagramType: currentType, blockContent: currentBlock.join("\n") });
          currentBlock = [];
        }
        currentType = line.split(":")[1].trim().toLowerCase();
      } else {
        currentBlock.push(line);
      }
    }
    if (currentBlock.length > 0) {
      blocks.push({ diagramType: currentType, blockContent: currentBlock.join("\n") });
    }

    blocks.forEach(block => {
      const divId = 'diagramDiv' + this.diagramCounter++;
      this.diagrams.push({ type: block.diagramType, content: block.blockContent, divId });
      setTimeout(() => {
        this.createDiagram(divId, block.diagramType, block.blockContent);
      }, 0);
    });
  }

  // Analyse le contenu d'un bloc pour extraire #nodes, #links et #options
  parseDiagramContent(content: string) {
    const lines = content.split('\n');
    let section = 'nodes';
    let nodes: any[] = [];
    let links: any[] = [];
    let options: { [key: string]: string } = {};

    for (let line of lines) {
      line = line.trim();
      if (line === '') continue;
      if (line.startsWith('#')) {
        if (line.toLowerCase().startsWith('#nodes')) {
          section = 'nodes';
          continue;
        } else if (line.toLowerCase().startsWith('#links')) {
          section = 'links';
          continue;
        } else if (line.toLowerCase().startsWith('#options')) {
          section = 'options';
          continue;
        }
      }
      if (section === 'nodes') {
        // Format attendu : id: texte, prop1: valeur1, prop2: valeur2
        const parts = line.split(',');
        if (parts.length > 0) {
          const [idPart, ...rest] = parts;
          const idSplit = idPart.split(':');
          if (idSplit.length >= 2) {
            const id = idSplit[0].trim();
            const text = idSplit.slice(1).join(':').trim();
            let nodeObj: any = { key: id, text: text };
            rest.forEach(prop => {
              const propParts = prop.split(':');
              if (propParts.length === 2) {
                const key = propParts[0].trim();
                const value = propParts[1].trim();
                nodeObj[key] = value;
              }
            });
            nodes.push(nodeObj);
          }
        }
      } else if (section === 'links') {
        // Format attendu : from -> to
        const linkParts = line.split('->');
        if (linkParts.length === 2) {
          const from = linkParts[0].trim();
          const to = linkParts[1].trim();
          links.push({ from, to });
        }
      } else if (section === 'options') {
        const optionParts = line.split(',');
        optionParts.forEach(opt => {
          const kv = opt.split(':');
          if (kv.length === 2) {
            const key = kv[0].trim();
            const value = kv[1].trim();
            options[key] = value;
          }
        });
      }
    }
    return { nodes, links, options };
  }

  // Création du diagramme GoJS dans le conteneur identifié par divId
  createDiagram(divId: string, diagramType: string, content: string) {
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, divId, { 'undoManager.isEnabled': true });

    // Configuration des templates de lien selon le type
    if (diagramType === 'network' || diagramType === 'flowchart') {
      // Pour network et flowchart : flèches avec angles droits (routing orthogonal)
      diagram.linkTemplate =
        $(go.Link,
          {
            routing: go.Link.Orthogonal,
            corner: 0,
            curviness: 0,
            fromSpot: go.Spot.AllSides,
            toSpot: go.Spot.AllSides
          },
          $(go.Shape, { stroke: "#2F4F4F", strokeWidth: 2 }),
          $(go.Shape, { toArrow: "Standard", stroke: "#2F4F4F", fill: "#2F4F4F" })
        );
    } else {
      // Template générique (avec arrondis)
      diagram.linkTemplate =
        $(go.Link, { routing: go.Link.AvoidsNodes, curve: go.Link.Bezier, corner: 10 },
          $(go.Shape, { stroke: "#2F4F4F", strokeWidth: 2 }),
          $(go.Shape, { toArrow: "Standard", stroke: "#2F4F4F", fill: "#2F4F4F" })
        );
    }

    // Configuration spécifique pour le diagramme réseau
    if (diagramType === 'network') {
      diagram.nodeTemplate =
        $(go.Node, "Vertical",
          $(go.Picture,
            {
              desiredSize: new go.Size(70, 70),
              margin: 4
            },
            new go.Binding("source", "key", (key: string) => {
              const lowerKey = key.toLowerCase();
              if (lowerKey.indexOf("router") !== -1) return "assets/network/router-svgrepo-com.svg";
              if (lowerKey.indexOf("switch") !== -1) return "assets/network/switch-svgrepo-com.svg";
              if (lowerKey.indexOf("server") !== -1) return "assets/network/server-svgrepo-com.svg";
              if (lowerKey.indexOf("1u-server") !== -1) return "assets/network/1u-server-svgrepo-com.svg";
              if (lowerKey.indexOf("2u-server") !== -1) return "assets/network/2u-server-svgrepo-com.svg";
              if (lowerKey.indexOf("3u-server") !== -1) return "assets/network/3u-server-svgrepo-com.svg";
              if (lowerKey.indexOf("cloud-database") !== -1) return "assets/network/cloud-database-svgrepo-com.svg";
              if (lowerKey.indexOf("cloud-download") !== -1) return "assets/network/cloud-download-svgrepo-com.svg";
              if (lowerKey.indexOf("cloud-server") !== -1) return "assets/network/cloud-server-svgrepo-com.svg";
              if (lowerKey.indexOf("cloud-server2") !== -1) return "assets/network/cloud-server2-svgrepo-com.svg";
              if (lowerKey.indexOf("cloud") !== -1) return "assets/network/cloud-svgrepo-com.svg";
              if (lowerKey.indexOf("code") !== -1) return "assets/network/code-svgrepo-com.svg";
              if (lowerKey.indexOf("database") !== -1) return "assets/network/database-svgrepo-com.svg";
              if (lowerKey.indexOf("disk1") !== -1) return "assets/network/disk1-svgrepo-com.svg";
              if (lowerKey.indexOf("disk2") !== -1) return "assets/network/disk2-svgrepo-com.svg";
              if (lowerKey.indexOf("firewalld2") !== -1) return "assets/network/firewalld2-svgrepo-com.svg";
              if (lowerKey.indexOf("node") !== -1) return "assets/network/node-svgrepo-com.svg";
              if (lowerKey.indexOf("pc") !== -1) return "assets/network/pc-svgrepo-com.svg";
              if (lowerKey.indexOf("upload") !== -1) return "assets/network/upload-svgrepo-com.svg";
              return "https://gojs.net/latest/samples/assets/default.png";
            })
          ),
          $(go.TextBlock,
            { margin: 2, font: "bold 12px sans-serif", stroke: "#003366" },
            new go.Binding("text", "text")
          )
        );
    } else {
      // Template générique pour les autres diagrammes
      diagram.nodeTemplate =
        $(go.Node, "Auto",
          $(go.Shape,
            { stroke: "#696969", strokeWidth: 2 },
            new go.Binding("figure", "shape"),
            new go.Binding("fill", "fill")
          ),
          $(go.TextBlock,
            { margin: 8, font: "bold 14px sans-serif", stroke: "#333" },
            new go.Binding("text", "text")
          )
        );
    }

    // Extraction des données depuis le Markdown
    const { nodes, links, options } = this.parseDiagramContent(content);
    diagram.model = new go.GraphLinksModel(nodes, links);

    // Configuration des layouts
    switch (diagramType) {
      case 'flowchart':
        diagram.layout = $(go.TreeLayout, {
          angle: 90,
          layerSpacing: 50,
          nodeSpacing: 20,
          arrangementSpacing: new go.Size(20, 20)
        });
        break;
      case 'organization':
      case 'orgchart':
        diagram.layout = $(go.TreeLayout, {
          angle: 90,
          layerSpacing: 40,
          arrangement: go.TreeLayout.ArrangementHorizontal,
          nodeSpacing: 30,
          arrangementSpacing: new go.Size(30, 30)
        });
        break;
      case 'family':
        diagram.layout = $(go.TreeLayout, {
          angle: 90,
          layerSpacing: 60,
          nodeSpacing: 20,
          arrangementSpacing: new go.Size(20, 20)
        });
        break;
      case 'state':
        diagram.layout = $(go.CircularLayout, {
          startAngle: 0,
          sweep: 2 * Math.PI,
          spacing: 30
        });
        break;
      case 'network':
        diagram.layout = $(go.ForceDirectedLayout, {
          defaultSpringLength: 100,
          defaultElectricalCharge: 150,
          maxIterations: 200
        });
        break;
      case 'block':
        diagram.layout = $(go.GridLayout, {
          wrappingColumn: parseInt(options['columns']) || 3,
          spacing: new go.Size(20, 20)
        });
        break;
      case 'class':
        diagram.layout = $(go.TreeLayout, {
          angle: 90,
          layerSpacing: 50,
          nodeSpacing: 20,
          arrangementSpacing: new go.Size(20, 20)
        });
        break;
      case 'draggable':
        diagram.allowDrop = true;
        diagram.toolManager.draggingTool.dragsLink = true;
        diagram.layout = $(go.TreeLayout, {
          angle: 90,
          layerSpacing: 50,
          nodeSpacing: 20,
          arrangementSpacing: new go.Size(20, 20)
        });
        break;
      case 'record':
        diagram.layout = $(go.LayeredDigraphLayout, {
          direction: 90,
          layerSpacing: 40
        });
        break;
      default:
        if (diagramType !== 'network' && diagramType !== 'flowchart') {
          diagram.layout = $(go.TreeLayout, {
            angle: 90,
            layerSpacing: 50,
            nodeSpacing: 20,
            arrangementSpacing: new go.Size(20, 20)
          });
        }
        break;
    }

    // Application d'options globales (par exemple, couleur par défaut des nœuds)
    if (options['nodeFill']) {
      diagram.model.nodeDataArray.forEach((node: any) => {
        if (!node.fill) {
          node.fill = options['nodeFill'];
        }
      });
    }
  }

  exportPDF() {
    let diagramToExport = this.currentDiagram;
    if (!diagramToExport && this.diagrams.length > 0) {
      // Récupérer le diagramme depuis son conteneur
      diagramToExport = go.Diagram.fromDiv(this.diagrams[this.diagrams.length - 1].divId);
    }
    if (!diagramToExport) {
      console.error("Aucun diagramme n'a été trouvé pour l'export PDF.");
      return;
    }
    const imgData = diagramToExport.makeImageData({ background: "white", type: "png", scale: 1 });
    if (!imgData || typeof imgData !== 'string') {
      console.error("L'image n'a pas pu être générée ou n'est pas une chaîne.");
      return;
    }
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      const pdfWidth = pageWidth - 20;
      const pdfHeight = pdfWidth / ratio;
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
      pdf.save("diagram.pdf");
    };
    img.onerror = (err) => {
      console.error("Erreur de chargement de l'image", err);
    };
    img.src = imgData;
  }
  
  

  // Passer en mode plein écran pour le dernier diagramme affiché
  fullScreen() {
    const lastDiagramDiv = this.diagrams.length ? document.getElementById(this.diagrams[this.diagrams.length - 1].divId) : null;
    if (lastDiagramDiv) {
      if (lastDiagramDiv.requestFullscreen) {
        lastDiagramDiv.requestFullscreen();
      } else if ((lastDiagramDiv as any).webkitRequestFullscreen) { // Safari
        (lastDiagramDiv as any).webkitRequestFullscreen();
      } else if ((lastDiagramDiv as any).msRequestFullscreen) { // IE11
        (lastDiagramDiv as any).msRequestFullscreen();
      }
    }
  }

  exportPNG() {
    let diagram = this.currentDiagram;
    if (!diagram && this.diagrams.length > 0) {
      diagram = go.Diagram.fromDiv(this.diagrams[this.diagrams.length - 1].divId);
    }
    if (!diagram) {
      console.error("Aucun diagramme disponible pour l'export PNG.");
      return;
    }
    const imgData = diagram.makeImageData({ background: "white" });
    if (!imgData || typeof imgData !== "string") {
      console.error("L'image n'a pas pu être générée ou n'est pas une chaîne.");
      return;
    }
    const a = document.createElement("a");
    a.href = imgData;
    a.download = "diagram.png";
    a.click();
  }
  
  zoomIn() {
    let diagram = this.currentDiagram;
    if (!diagram && this.diagrams.length > 0) {
      diagram = go.Diagram.fromDiv(this.diagrams[this.diagrams.length - 1].divId);
    }
    if (diagram) {
      diagram.commandHandler.increaseZoom();
    } else {
      console.error("Aucun diagramme disponible pour zoomer.");
    }
  }
  
  zoomOut() {
    let diagram = this.currentDiagram;
    if (!diagram && this.diagrams.length > 0) {
      diagram = go.Diagram.fromDiv(this.diagrams[this.diagrams.length - 1].divId);
    }
    if (diagram) {
      diagram.commandHandler.decreaseZoom();
    } else {
      console.error("Aucun diagramme disponible pour dézoomer.");
    }
  }
  
}
