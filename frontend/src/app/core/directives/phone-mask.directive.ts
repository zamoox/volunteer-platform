import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatUkrainianPhoneNumber } from '@core/utils/phone.util'; // Шлях до твоєї утиліти

@Directive({
  selector: '[appPhoneMask]',
  standalone: true
})
export class PhoneMaskDirective {
  private ngControl = inject(NgControl, { optional: true });
  private el = inject(ElementRef); // Отримуємо посилання на сам елемент

  @HostListener('keydown.backspace')
    onBackspace(): void {
      const input = this.el.nativeElement as HTMLInputElement;
      // Якщо в полі залишилося тільки "+380 " або менше, очищуємо повністю
      if (input.value.length <= 5) {
        input.value = '';
        this.ngControl?.control?.setValue('', { emitEvent: false });
      }
    }

  @HostListener('input')
  onInput(): void {
    const inputElement = this.el.nativeElement as HTMLInputElement;
    const rawValue = inputElement.value;
    
    // Якщо поле пусте, не форсуємо +380 (даємо валідатору 'required' спрацювати)
    if (!rawValue) return;

    const formattedValue = formatUkrainianPhoneNumber(rawValue);
    inputElement.value = formattedValue;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(formattedValue, { emitEvent: false });
    }
  }
}