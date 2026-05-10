import { TestBed } from '@angular/core/testing';

import { AdminCustomer } from './admin-customer';

describe('AdminCustomer', () => {
  let service: AdminCustomer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminCustomer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
