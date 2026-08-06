import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
})
export class AutoFocus {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  constructor() {
    afterNextRender(() => {
      this.elementRef.nativeElement.focus();
    });
  }
}
