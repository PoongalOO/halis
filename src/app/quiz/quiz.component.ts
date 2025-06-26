import { Component, OnInit } from '@angular/core';
import { QuizService, Quiz } from '../quiz.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

interface QuizQuestion {
  question: string;
  answers: { text: string, correct: boolean }[];
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule,FormsModule, InputTextModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent {
  quizQuestions: QuizQuestion[] = [];
  userAnswers: string[] = [];
  submitted: boolean = false;
  score: number = 0;
  currentQuestionIndex: number = 0;

  get currentQuestion(): QuizQuestion | undefined {
    return this.quizQuestions[this.currentQuestionIndex];
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const md = e.target?.result as string;
      this.quizQuestions = this.parseMarkdown(md);
      this.userAnswers = new Array(this.quizQuestions.length).fill('');
      this.submitted = false;
      this.score = 0;
      this.currentQuestionIndex = 0;
    };
    reader.readAsText(file);
  }

  parseMarkdown(md: string): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    const lines = md.split('\n');
    let currentQuestion: QuizQuestion | null = null;
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('## Question:')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        const match = trimmedLine.match(/^## Question:\s*(?:\[[^\]]+\])?\s*(.*)$/);
        const questionText = match ? match[1].trim() : trimmedLine.substring(12).trim();
        currentQuestion = { question: questionText, answers: [] };
      } else if (trimmedLine.startsWith('-')) {
        if (currentQuestion) {
          let answerText = trimmedLine.substring(1).trim();
          let isCorrect = false;
          if (answerText.endsWith('(correct)')) {
            isCorrect = true;
            answerText = answerText.replace('(correct)', '').trim();
          }
          currentQuestion.answers.push({ text: answerText, correct: isCorrect });
        }
      }
    }
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    return questions;
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.quizQuestions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      this.submitQuiz();
    }
  }

  submitQuiz(): void {
    this.submitted = true;
    this.score = this.quizQuestions.reduce((score, q, i) => {
      return score + (q.answers.some(a => a.text === this.userAnswers[i] && a.correct) ? 1 : 0);
    }, 0);
  }

  isCorrect(index: number): boolean {
    const q = this.quizQuestions[index];
    return q.answers.some(a => a.text === this.userAnswers[index] && a.correct);
  }

  getCorrectAnswer(q: QuizQuestion): string {
    const correct = q.answers.find(a => a.correct);
    return correct ? correct.text : '';
  }
}
