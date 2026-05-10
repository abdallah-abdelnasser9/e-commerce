import { TestBed } from '@angular/core/testing';

import { AdminOrder } from './admin-order';

describe('AdminOrder', () => {
  let service: AdminOrder;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminOrder);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
