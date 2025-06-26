import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkmapComponent } from './markmap.component';

describe('MarkmapComponent', () => {
  let component: MarkmapComponent;
  let fixture: ComponentFixture<MarkmapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkmapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
