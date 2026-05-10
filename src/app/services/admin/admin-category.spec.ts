import { TestBed } from '@angular/core/testing';

import { AdminCategory } from './admin-category';

describe('AdminCategory', () => {
  let service: AdminCategory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminCategory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
