export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string) {
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
  return null;
}

export function validateRequestForm(data: {
  title: string; description: string; waste_type: string; address: string;
}) {
  const errors: Record<string, string> = {};
  if (!data.title.trim()) errors.title = 'El título es requerido';
  if (!data.description.trim()) errors.description = 'La descripción es requerida';
  if (!data.waste_type) errors.waste_type = 'El tipo de residuo es requerido';
  if (!data.address.trim()) errors.address = 'La dirección es requerida';
  return errors;
}
