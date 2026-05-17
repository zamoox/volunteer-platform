import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowToHelpComponent } from './how-to-help.component';

describe('HowToHelpComponent', () => {
  let component: HowToHelpComponent;
  let fixture: ComponentFixture<HowToHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowToHelpComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HowToHelpComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
