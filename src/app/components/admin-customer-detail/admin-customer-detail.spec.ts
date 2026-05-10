import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCustomerDetail } from './admin-customer-detail';

describe('AdminCustomerDetail', () => {
  let component: AdminCustomerDetail;
  let fixture: ComponentFixture<AdminCustomerDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCustomerDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCustomerDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
