export function formatUkrainianPhoneNumber(value: string | null | undefined): string {
  // Якщо юзер все видалив, повертаємо пустий рядок, щоб не було петлі з "+380"
  if (!value || value.length < 4 && value.includes('+')) return '';

  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('380')) digits = digits.substring(3);
  else if (digits.startsWith('80')) digits = digits.substring(2);
  else if (digits.startsWith('0')) digits = digits.substring(1);

  digits = digits.substring(0, 9);

  if (digits.length === 0) return '+380 '; // Початковий стан

  let formatted = '+380';
  if (digits.length > 0) formatted += ' ' + digits.substring(0, 2);
  if (digits.length >= 3) formatted += ' ' + digits.substring(2, 5);
  if (digits.length >= 6) formatted += ' ' + digits.substring(5, 7);
  if (digits.length >= 8) formatted += ' ' + digits.substring(7, 9);

  return formatted;
}