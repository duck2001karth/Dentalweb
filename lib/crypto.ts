import crypto from "node:crypto"

// Debes agregar en tu archivo .env: ENCRYPTION_KEY=tu_clave_super_secreta_de_32_caracteres
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ""
const ALGORITHM = "aes-256-gcm"

export function encryptData(text: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("ENCRYPTION_KEY no configurada correctamente en las variables de entorno. Debe tener 32 caracteres.")
  }
  
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
  
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`
}

export function decryptData(encryptedData: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("ENCRYPTION_KEY no configurada correctamente.")
  }
  
  const parts = encryptedData.split(":")
  if (parts.length !== 3) throw new Error("Formato de cifrado inválido en la base de datos.")

  const iv = Buffer.from(parts[0], "hex")
  const authTag = Buffer.from(parts[1], "hex")
  const encryptedText = parts[2]

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")
  
  return decrypted
}