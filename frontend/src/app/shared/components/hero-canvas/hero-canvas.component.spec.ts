import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroCanvasComponent } from './hero-canvas.component';

describe('HeroCanvasComponent', () => {
  let component: HeroCanvasComponent;
  let fixture: ComponentFixture<HeroCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroCanvasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroCanvasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
