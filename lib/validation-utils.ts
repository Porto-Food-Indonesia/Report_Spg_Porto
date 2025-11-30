// Utility functions for data validation

export interface ValidationError {
  field: string
  message: string
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate required field
export function validateRequired(value: string | number | null | undefined): boolean {
  return value !== null && value !== undefined && String(value).trim().length > 0
}

// Validate phone number (Indonesian format)
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

// Validate sales amount (must be positive number)
export function validateAmount(amount: string | number): boolean {
  const num = Number(amount)
  return !isNaN(num) && num > 0
}

// Validate date range
export function validateDateRange(startDate: string | Date, endDate: string | Date): boolean {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return start <= end
}

// Batch validation for form data
export function validateFormData(
  data: Record<string, any>,
  rules: Record<string, (value: any) => boolean | string>,
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const [field, validator] of Object.entries(rules)) {
    const value = data[field]
    const result = validator(value)

    if (result !== true) {
      errors.push({
        field,
        message: typeof result === "string" ? result : `${field} is invalid`,
      })
    }
  }

  return errors
}
