/**
 * XLSX open-password encryption helper.
 *
 * Notes:
 * - ExcelJS cannot password-protect XLSX by itself.
 * - We generate XLSX via ExcelJS, then encrypt the file so Excel prompts for a password to open it.
 */

export function getExcelExportPassword() {
  const pwd = process.env.EXCEL_EXPORT_PASSWORD || process.env.NEXTAUTH_SECRET
  if (!pwd || String(pwd).trim().length === 0) {
    throw new Error(
      'Excel export password is not configured. Set EXCEL_EXPORT_PASSWORD (recommended) or NEXTAUTH_SECRET.'
    )
  }
  return String(pwd)
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

