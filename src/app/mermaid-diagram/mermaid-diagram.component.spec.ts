import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MermaidDiagramComponent } from './mermaid-diagram.component';

describe('MermaidDiagramComponent', () => {
  let component: MermaidDiagramComponent;
  let fixture: ComponentFixture<MermaidDiagramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MermaidDiagramComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MermaidDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
