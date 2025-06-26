import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private activeComponentSource = new BehaviorSubject<string>('home');
  activeComponent$ = this.activeComponentSource.asObservable();

  setActiveComponent(component: string): void {
    this.activeComponentSource.next(component);
  }
}