import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagPertComponent } from './diag-pert.component';

describe('DiagPertComponent', () => {
  let component: DiagPertComponent;
  let fixture: ComponentFixture<DiagPertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagPertComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiagPertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
