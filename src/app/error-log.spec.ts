import { TestBed } from '@angular/core/testing';

import { ErrorLog } from './error-log';

describe('ErrorLog', () => {
  let errorLog: ErrorLog;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    errorLog = TestBed.inject(ErrorLog);
  });

  it('should start empty', () => {
    expect(errorLog.all()).toEqual([]);
  });

  it('should record an Error instance by its message', () => {
    errorLog.record(new Error('boom'));

    expect(errorLog.all()).toHaveLength(1);
    expect(errorLog.all()[0].message).toBe('boom');
  });

  it('should stringify a non-Error value rather than dropping it', () => {
    errorLog.record('a plain string rejection');

    expect(errorLog.all()[0].message).toBe('a plain string rejection');
  });

  it('should cap history at 50 entries, keeping the most recent', () => {
    for (let i = 0; i < 55; i++) {
      errorLog.record(new Error(`error ${i}`));
    }

    const all = errorLog.all();
    expect(all).toHaveLength(50);
    expect(all[0].message).toBe('error 5');
    expect(all[all.length - 1].message).toBe('error 54');
  });
});
