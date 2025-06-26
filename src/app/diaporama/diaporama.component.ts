import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-diaporama',
  imports: [CommonModule, InputTextModule],
  templateUrl: './diaporama.component.html',
  styleUrls: ['./diaporama.component.scss']
})
export class DiaporamaComponent {
  htmlSlides: string[] = [];
  currentIndex = 0;
  theme = 'light';
  summary: { title: string; index: number }[] = [];
  showToc = true;
  fontSize = 100; // en %

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const text = await file.text();
    await this.renderMarpSlides(text);
  }

  async renderMarpSlides(md: string) {
    const slides = md.split(/^---$/m); // Marp utilise '---' pour séparer
    this.summary = [];
    const promises = slides.map(async (slide, index) => {
      const trimmed = slide.trim();
  
      // 🧠 Titre pour sommaire (h1 ou h2)
      const titleMatch = trimmed.match(/^#{1,2}\s+(.+)/m);
      if (titleMatch) {
        this.summary.push({ title: titleMatch[1], index });
      } else {
        this.summary.push({ title: `Diapo ${index + 1}`, index });
      }
  
      const rawHtml = await marked.parse(trimmed);
      return DOMPurify.sanitize(rawHtml);
    });
  
    this.htmlSlides = await Promise.all(promises);
    this.currentIndex = 0;
  }
  
  prevSlide() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextSlide() {
    if (this.currentIndex < this.htmlSlides.length - 1) this.currentIndex++;
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
  }

  toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  }

  toggleToc() {
    this.showToc = !this.showToc;
  }

  async exportToPDF() {
    const slides = document.querySelectorAll('.slide');
    const pdf = new jsPDF('p', 'mm', 'a4');

    for (let i = 0; i < slides.length; i++) {
      const canvas = await html2canvas(slides[i] as HTMLElement);
      const imgData = canvas.toDataURL('image/png');
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save('diaporama.pdf');
  }

  @HostListener('document:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') this.nextSlide();
    if (event.key === 'ArrowLeft') this.prevSlide();
  }

  increaseFontSize() {
    if (this.fontSize < 300) this.fontSize += 10;
  }
  
  decreaseFontSize() {
    if (this.fontSize > 50) this.fontSize -= 10;
  }
}