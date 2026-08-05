import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ErrorLog } from './error-log';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  let handler: ErrorHandler;
  let errorLog: ErrorLog;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
    });
    handler = TestBed.inject(ErrorHandler);
    errorLog = TestBed.inject(ErrorLog);
  });

  it('should record the error into ErrorLog', () => {
    handler.handleError(new Error('component blew up'));

    expect(errorLog.all()).toHaveLength(1);
    expect(errorLog.all()[0].message).toBe('component blew up');
  });

  it('should still hand the error off to the default handler, not swallow it', () => {
    expect(() => handler.handleError(new Error('boom'))).not.toThrow();
    expect(console.error).toHaveBeenCalled();
  });
});
