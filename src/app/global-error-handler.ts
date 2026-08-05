import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ErrorLog } from './error-log';

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  private readonly errorLog = inject(ErrorLog);

  override handleError(error: unknown): void {
    this.errorLog.record(error);
    super.handleError(error);
  }
}
