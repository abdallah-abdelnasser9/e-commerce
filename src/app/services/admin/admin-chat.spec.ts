import { TestBed } from '@angular/core/testing';

import { AdminChat } from './admin-chat';

describe('AdminChat', () => {
  let service: AdminChat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminChat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
