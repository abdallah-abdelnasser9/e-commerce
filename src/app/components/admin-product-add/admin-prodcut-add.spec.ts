import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProdcutAdd } from './admin-prodcut-add';

describe('AdminProdcutAdd', () => {
  let component: AdminProdcutAdd;
  let fixture: ComponentFixture<AdminProdcutAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProdcutAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProdcutAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
