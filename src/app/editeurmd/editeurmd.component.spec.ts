import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditeurmdComponent } from './editeurmd.component';

describe('EditeurmdComponent', () => {
  let component: EditeurmdComponent;
  let fixture: ComponentFixture<EditeurmdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditeurmdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditeurmdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
