import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductEditComponent } from './admin-product-edit';

describe('AdminProductEdit', () => {
  let component: ProductEditComponent;
  let fixture: ComponentFixture<ProductEditComponent>;    
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
