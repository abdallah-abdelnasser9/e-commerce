import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminChat } from './admin-chat';

describe('AdminChat', () => {
  let component: AdminChat;
  let fixture: ComponentFixture<AdminChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminChat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
