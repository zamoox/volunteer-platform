import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestPopupComponent } from './request-popup.component';

describe('RequestPopupComponent', () => {
  let component: RequestPopupComponent;
  let fixture: ComponentFixture<RequestPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestPopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestPopupComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
