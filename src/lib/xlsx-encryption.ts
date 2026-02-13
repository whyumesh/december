/**
 * XLSX open-password encryption helper.
 *
 * Notes:
 * - ExcelJS cannot password-protect XLSX by itself.
 * - We generate XLSX via ExcelJS, then encrypt the file so Excel prompts for a password to open it.
 * - Password is 8 characters, alphanumeric only (letters and digits).
 */

const DEFAULT_EXCEL_EXPORT_PASSWORD = 'Export12'

function to8Alphanumeric(value: string): string {
  const alphanumeric = value.replace(/[^A-Za-z0-9]/g, '')
  if (alphanumeric.length >= 8) return alphanumeric.slice(0, 8)
  return alphanumeric.padEnd(8, '0')
}

export function getExcelExportPassword() {
  const envPwd = process.env.EXCEL_EXPORT_PASSWORD?.trim()
  if (envPwd && envPwd.length > 0) {
    return to8Alphanumeric(envPwd)
  }
  return DEFAULT_EXCEL_EXPORT_PASSWORD
}

function toBuffer(input: unknown): Buffer {
  if (Buffer.isBuffer(input)) return input
  if (input instanceof Uint8Array) return Buffer.from(input)
  if (input instanceof ArrayBuffer) return Buffer.from(new Uint8Array(input))
  // exceljs can return plain objects in some runtimes; last resort
  return Buffer.from(input as any)
}

export async function encryptXlsxBuffer(xlsx: unknown, password: string): Promise<Buffer> {
  // officecrypto-tool is CommonJS; handle both import shapes.
  const mod: any = await import('officecrypto-tool')
  const officeCrypto = mod?.default || mod

  const input = toBuffer(xlsx)
  const encrypted = officeCrypto.encrypt(input, { password })
  return toBuffer(encrypted)
}

