import { TestBed } from '@angular/core/testing';

import { HalisLinkService } from './halis-link.service';

describe('HalisLinkService', () => {
  let service: HalisLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HalisLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
