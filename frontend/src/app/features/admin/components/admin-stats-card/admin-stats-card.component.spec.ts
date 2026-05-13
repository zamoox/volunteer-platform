import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminStatsCardComponent } from './admin-stats-card.component';

describe('AdminStatsCardComponent', () => {
  let component: AdminStatsCardComponent;
  let fixture: ComponentFixture<AdminStatsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminStatsCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminStatsCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
