import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationSetupComponent } from './organization-setup.component';

describe('OrganizationSetupComponent', () => {
  let component: OrganizationSetupComponent;
  let fixture: ComponentFixture<OrganizationSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationSetupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationSetupComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
