import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOrgsTableComponent } from './admin-orgs-table.component';

describe('AdminOrgsTableComponent', () => {
  let component: AdminOrgsTableComponent;
  let fixture: ComponentFixture<AdminOrgsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrgsTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOrgsTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
