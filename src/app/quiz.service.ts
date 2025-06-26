import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QuizService {
  constructor(private http: HttpClient) {}

  async loadQuiz(mdPath: string): Promise<Quiz> {
    const md = await firstValueFrom(this.http.get(mdPath, { responseType: 'text' }));
    return this.parseMarkdown(md);
  }

  parseMarkdown(md: string): Quiz {
    const questions = [];
    const lines = md.split('\n');
    let currentQuestion: any = null;

    lines.forEach(line => {
      if (line.startsWith('## Question:')) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          question: line.replace(/## Question:.*?\]/, '').trim(),
          answers: []
        };
      } else if (line.startsWith('-')) {
        const isCorrect = line.endsWith('(correct)');
        currentQuestion.answers.push({
          text: line.replace('- ', '').replace(' (correct)', '').trim(),
          correct: isCorrect
        });
      }
    });
    if (currentQuestion) questions.push(currentQuestion);
    return { questions };
  }
}

export interface Quiz {
  questions: {
    question: string;
    answers: { text: string; correct: boolean }[];
  }[];
}
