import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-markmap',
  imports: [InputTextModule],
  templateUrl: './markmap.component.html',
  styleUrls: ['./markmap.component.scss']
})
export class MarkmapComponent {
@ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef<SVGSVGElement>;

  private transformer = new Transformer();
  private markmapInstance: Markmap | null = null;

  collapseState = false;
  originalMarkdown = '';
  buttonBarVisible = false;

  ngOnInit(): void {
    this.setTheme('light');
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const content = await file.text();
    this.originalMarkdown = content;
    this.renderMindmap(content);
  }

  renderMindmap(markdown: string) {
    const { content, title } = this.extractFrontMatter(markdown);
    const { root } = this.transformer.transform(content);

    const svg = this.svgContainer.nativeElement;
    svg.innerHTML = '';

    const finalRoot = title
      ? {
          type: 'heading',
          depth: 1,
          content: title,
          children: [root]
        }
      : root;

    this.markmapInstance = Markmap.create(svg, {}, finalRoot);
  }

  extractFrontMatter(markdown: string): { content: string, title?: string } {
    const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!match) return { content: markdown };

    const yaml = match[1];
    const content = markdown.slice(match[0].length);

    let title: string | undefined;
    const titleMatch = yaml.match(/^title:\s*(.+)$/m);
    if (titleMatch) title = titleMatch[1].trim();

    return { content, title };
  }

  toggleCollapse() {
    if (!this.markmapInstance) return;
    this.collapseState = !this.collapseState;

    const instance = this.markmapInstance as any;
    const updateRecursively = (node: any) => {
      if (node.children?.length) {
        instance.updateNode(node, { _collapsed: this.collapseState });
        node.children.forEach(updateRecursively);
      }
    };

    updateRecursively(instance.state.data);
  }

  async exportToPNG() {
    const node = this.svgContainer.nativeElement;
    const dataUrl = await htmlToImage.toPng(node as unknown as HTMLElement);
    const link = document.createElement('a');
    link.download = 'carte-mentale.png';
    link.href = dataUrl;
    link.click();
  }

  async exportToPDF() {
    const node = this.svgContainer.nativeElement;
    const dataUrl = await htmlToImage.toPng(node as unknown as HTMLElement);

    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgProps = (pdf as any).getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('carte-mentale.pdf');
  }

  setTheme(theme: 'light' | 'dark') {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${theme}-theme`);
  }

  toggleButtonBar() {
    this.buttonBarVisible = !this.buttonBarVisible;
  }

  toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  }
}
