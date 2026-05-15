import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileRequestsComponent } from './profile-requests.component';

describe('ProfileRequestsComponent', () => {
  let component: ProfileRequestsComponent;
  let fixture: ComponentFixture<ProfileRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileRequestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileRequestsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
