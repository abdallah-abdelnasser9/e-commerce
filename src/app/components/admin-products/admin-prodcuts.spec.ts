import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProdcuts } from './admin-prodcuts';

describe('AdminProdcuts', () => {
  let component: AdminProdcuts;
  let fixture: ComponentFixture<AdminProdcuts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProdcuts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProdcuts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
