import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartGeneratorComponent } from './chart-generator.component';

describe('ChartGeneratorComponent', () => {
  let component: ChartGeneratorComponent;
  let fixture: ComponentFixture<ChartGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
