import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XmindToMdComponent } from './xmind-to-md.component';

describe('XmindToMdComponent', () => {
  let component: XmindToMdComponent;
  let fixture: ComponentFixture<XmindToMdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XmindToMdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XmindToMdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
