import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Catálogo extraído y estructurado del documento original //[cite: 1]
const catalogData = [
  // ODONTOLOGÍA GENERAL
  { category: "General", code: "GEN-001", name: "Consulta", basePrice: 10 },
  { category: "General", code: "GEN-002", name: "Blanqueamiento", basePrice: 140 },
  { category: "General", code: "GEN-003", name: "Blanqueamiento interno", basePrice: 90 },
  { category: "General", code: "GEN-004", name: "Resinas simples", basePrice: 25 },
  { category: "General", code: "GEN-005", name: "Resinas compuestas", basePrice: 35 },
  { category: "General", code: "GEN-006", name: "Resinas complejas", basePrice: 45 },
  { category: "General", code: "GEN-007", name: "Profilaxis + cepillo", basePrice: 25 },
  { category: "General", code: "GEN-008", name: "Exodoncias anteriores", basePrice: 35 },
  { category: "General", code: "GEN-009", name: "Exodoncias posteriores", basePrice: 45 },
  { category: "General", code: "GEN-010", name: "Exodoncias de remanentes anteriores", basePrice: 40 },
  { category: "General", code: "GEN-011", name: "Exodoncias de remanentes posteriores", basePrice: 50 },
  { category: "General", code: "GEN-012", name: "Restauración indirecta", basePrice: 50 },
  { category: "General", code: "GEN-013", name: "Cubeta para blanqueamiento casero en acetato blando + jeringa", basePrice: 70 },

  // ORTODONCIA
  { category: "Ortodoncia", code: "ORT-001", name: "Consulta", basePrice: 20 },
  { category: "Ortodoncia", code: "ORT-002", name: "Ortodoncia convencional", basePrice: 1100 },
  { category: "Ortodoncia", code: "ORT-003", name: "Ortodoncia invisaline básico", basePrice: 3000 },
  { category: "Ortodoncia", code: "ORT-004", name: "Ortodoncia con brackets de auto ligado", basePrice: 1350 },
  { category: "Ortodoncia", code: "ORT-005", name: "Ortodoncia con brackets estéticos", basePrice: 1300 },
  { category: "Ortodoncia", code: "ORT-006", name: "Exodoncia de cada premolar", basePrice: 35 },
  { category: "Ortodoncia", code: "ORT-007", name: "Pega Triflex completo", basePrice: 30 },
  { category: "Ortodoncia", code: "ORT-008", name: "Pega de triflex cada punto resina", basePrice: 5 },
  { category: "Ortodoncia", code: "ORT-009", name: "Retenedores con escaneado digital + porta retenedor", basePrice: 45 },
  { category: "Ortodoncia", code: "ORT-010", name: "Retenedores sin impresión (paciente trae modelo)", basePrice: 20 },
  { category: "Ortodoncia", code: "ORT-011", name: "Retiro de brackets + pulido", basePrice: 35 },
  { category: "Ortodoncia", code: "ORT-012", name: "Retiro de brackets + pulido No pacientes clínica", basePrice: 40 },
  { category: "Ortodoncia", code: "ORT-013", name: "Plano de mordida", basePrice: 90 },
  { category: "Ortodoncia", code: "ORT-014", name: "Rejilla lingual", basePrice: 80 },
  { category: "Ortodoncia", code: "ORT-015", name: "Hyrax", basePrice: 300 },
  { category: "Ortodoncia", code: "ORT-016", name: "MARPE", basePrice: 400 },
  { category: "Ortodoncia", code: "ORT-017", name: "Máscara facial", basePrice: 80 },
  { category: "Ortodoncia", code: "ORT-018", name: "Pistas acrílicas", basePrice: 70 },
  { category: "Ortodoncia", code: "ORT-019", name: "Repuesto de bracket convencional", basePrice: 5 },
  { category: "Ortodoncia", code: "ORT-020", name: "Repuesto de bracket autoligado", basePrice: 20 },
  { category: "Ortodoncia", code: "ORT-021", name: "Bracket reciclado", basePrice: 5 },
  { category: "Ortodoncia", code: "ORT-022", name: "Micro implantes", basePrice: 70 },

  // ORTOPEDIA
  { category: "Ortopedia", code: "OTP-001", name: "Consulta", basePrice: 20 },
  { category: "Ortopedia", code: "OTP-002", name: "Ortopedia (removible, klammt, Hamlet)", basePrice: 910 },
  { category: "Ortopedia", code: "OTP-003", name: "Banda transpalatino", basePrice: 90 },
  { category: "Ortopedia", code: "OTP-004", name: "Rejilla lingual", basePrice: 80 },
  { category: "Ortopedia", code: "OTP-005", name: "Barra lingual", basePrice: 90 },
  { category: "Ortopedia", code: "OTP-006", name: "Botón de nance", basePrice: 99 },
  { category: "Ortopedia", code: "OTP-007", name: "Placa Schwart superior con tornillo de expansión", basePrice: 160 },
  { category: "Ortopedia", code: "OTP-008", name: "Placa Schwart inferior con tornillo de expansión", basePrice: 160 },
  { category: "Ortopedia", code: "OTP-009", name: "Mantenedor de espacio", basePrice: 90 },
  { category: "Ortopedia", code: "OTP-010", name: "Aparato regulador de Frankel", basePrice: 150 },
  { category: "Ortopedia", code: "OTP-011", name: "Hyrax", basePrice: 300 },
  { category: "Ortopedia", code: "OTP-012", name: "Klammt", basePrice: 150 },

  // IMPLANTOLOGÍA
  { category: "Implantología", code: "IMP-001", name: "Consulta", basePrice: 20 },
  { category: "Implantología", code: "IMP-002", name: "Implante + corona", basePrice: 1100 },
  { category: "Implantología", code: "IMP-003", name: "Raspado quirúrgico por cuadrante", basePrice: 130 },
  { category: "Implantología", code: "IMP-004", name: "Raspado quirúrgico + PRF x cuadrante", basePrice: 150 },
  { category: "Implantología", code: "IMP-005", name: "Raspado no quirúrgico por cuadrante", basePrice: 40 },
  { category: "Implantología", code: "IMP-006", name: "Gingivectomia x OD", basePrice: 30 },
  { category: "Implantología", code: "IMP-007", name: "Gingivectomia por Hemiarcada", basePrice: 100 },
  { category: "Implantología", code: "IMP-008", name: "Injerto de hueso + membrana", basePrice: 400 },
  { category: "Implantología", code: "IMP-009", name: "Corona sobre implante", basePrice: 340 },

  // ESTÉTICA
  { category: "Estética", code: "EST-001", name: "Incrustación de ceromero", basePrice: 150 },
  { category: "Estética", code: "EST-002", name: "Incrustación de Discilicato de calcio", basePrice: 250 },
  { category: "Estética", code: "EST-003", name: "Incrustación de Zirconia", basePrice: 250 },
  { category: "Estética", code: "EST-004", name: "Alargamiento de corona con odontoseccion", basePrice: 80 },
  { category: "Estética", code: "EST-005", name: "Alargamiento de corona sin odontoseccion", basePrice: 40 },
  { category: "Estética", code: "EST-006", name: "Perno de fibra de vidrio", basePrice: 50 },
  { category: "Estética", code: "EST-007", name: "Carillas estéticas en resina por órgano dental", basePrice: 110 },

  // ENDODONCIA
  { category: "Endodoncia", code: "END-001", name: "Consulta", basePrice: 20 },
  { category: "Endodoncia", code: "END-002", name: "Endodoncias incisivos", basePrice: 140 },
  { category: "Endodoncia", code: "END-003", name: "Endodoncias premolares", basePrice: 170 },
  { category: "Endodoncia", code: "END-004", name: "Endodoncias molares", basePrice: 220 },
  { category: "Endodoncia", code: "END-005", name: "Retratamiento incisivos", basePrice: 190 },
  { category: "Endodoncia", code: "END-006", name: "Retratamiento premolares", basePrice: 220 },
  { category: "Endodoncia", code: "END-007", name: "Retratamiento molares", basePrice: 270 },
  { category: "Endodoncia", code: "END-008", name: "Apicectomia", basePrice: 200 },
  { category: "Endodoncia", code: "END-009", name: "Emergencia", basePrice: 80 },

  // CIRUGÍA ORAL
  { category: "Cirugía Oral", code: "CIR-001", name: "Exodoncias de remanentes complejos", basePrice: 40 },
  { category: "Cirugía Oral", code: "CIR-002", name: "Regularización de hueso por cuadrante", basePrice: 100 },
  { category: "Cirugía Oral", code: "CIR-003", name: "Frenectomia", basePrice: 120 },
  { category: "Cirugía Oral", code: "CIR-004", name: "Operculectomia", basePrice: 30 },
  { category: "Cirugía Oral", code: "CIR-005", name: "Botón quirúrgico + operculectomia", basePrice: 150 },

  // ODONTOPEDIATRÍA
  { category: "Odontopediatría", code: "PED-001", name: "Consulta", basePrice: 20 },
  { category: "Odontopediatría", code: "PED-002", name: "Fluorización cada sesión", basePrice: 20 },
  { category: "Odontopediatría", code: "PED-003", name: "Flúor barniz por órgano dental", basePrice: 10 },
  { category: "Odontopediatría", code: "PED-004", name: "Profilaxis", basePrice: 20 },
  { category: "Odontopediatría", code: "PED-005", name: "Sellantes de fosas y fisuras", basePrice: 25 },
  { category: "Odontopediatría", code: "PED-006", name: "Restauración simple", basePrice: 35 },
  { category: "Odontopediatría", code: "PED-007", name: "Restauración compleja", basePrice: 35 },
  { category: "Odontopediatría", code: "PED-008", name: "Pulpectomia anteriores", basePrice: 130 },
  { category: "Odontopediatría", code: "PED-009", name: "Pulpectomia en posteriores", basePrice: 160 },
  { category: "Odontopediatría", code: "PED-010", name: "Pulpotomia", basePrice: 130 },
  { category: "Odontopediatría", code: "PED-011", name: "Exodoncias simples", basePrice: 35 },
  { category: "Odontopediatría", code: "PED-012", name: "Exodoncias compuestas", basePrice: 45 },
  { category: "Odontopediatría", code: "PED-013", name: "Coronas de metal", basePrice: 80 },
  { category: "Odontopediatría", code: "PED-014", name: "Coronas de celuloide en resina", basePrice: 40 },

  // REHABILITACIÓN ORAL
  { category: "Rehabilitación Oral", code: "REH-001", name: "Consulta", basePrice: 20 },
  { category: "Rehabilitación Oral", code: "REH-002", name: "Prótesis Acker, Cromo-Cobalto", basePrice: 250 },
  { category: "Rehabilitación Oral", code: "REH-003", name: "Prótesis Cromo-cobalto 1-3 OD", basePrice: 320 },
  { category: "Rehabilitación Oral", code: "REH-004", name: "Prótesis removible Cromo-Cobalto 4-6 OD", basePrice: 370 },
  { category: "Rehabilitación Oral", code: "REH-005", name: "Prótesis removible Cromo-Cobalto 7-+", basePrice: 400 },
  { category: "Rehabilitación Oral", code: "REH-006", name: "Prótesis parcial removible Acker Flex", basePrice: 220 },
  { category: "Rehabilitación Oral", code: "REH-007", name: "Prótesis parcial removible Acker 1-3", basePrice: 270 },
  { category: "Rehabilitación Oral", code: "REH-008", name: "Prótesis parcial removible Acker 4-6", basePrice: 300 },
  { category: "Rehabilitación Oral", code: "REH-009", name: "Prótesis parcial removible Acker 7-9", basePrice: 330 },
  { category: "Rehabilitación Oral", code: "REH-010", name: "Prótesis parcial removible Acker 10-13", basePrice: 360 },
  { category: "Rehabilitación Oral", code: "REH-011", name: "Prótesis parcial removible acrílico 1-3", basePrice: 180 },
  { category: "Rehabilitación Oral", code: "REH-012", name: "Prótesis parcial removible acrílico 4-6", basePrice: 220 },
  { category: "Rehabilitación Oral", code: "REH-013", name: "Prótesis parcial removible acrílico 7-+", basePrice: 240 },
  { category: "Rehabilitación Oral", code: "REH-014", name: "Prótesis acrílico superior e inferior", basePrice: 560 },
  { category: "Rehabilitación Oral", code: "REH-015", name: "Prótesis total en dientes de porcelana", basePrice: 620 },
  { category: "Rehabilitación Oral", code: "REH-016", name: "Incrustación de ceromero INLAY/ ONLAY", basePrice: 150 },
  { category: "Rehabilitación Oral", code: "REH-017", name: "Incrustación de ceromero OVERLAY", basePrice: 180 },
  { category: "Rehabilitación Oral", code: "REH-018", name: "Incrustación de Disilicato de litio", basePrice: 250 },
  { category: "Rehabilitación Oral", code: "REH-019", name: "Perno resina", basePrice: 180 },
  { category: "Rehabilitación Oral", code: "REH-020", name: "Corona metal- porcelana", basePrice: 220 },
  { category: "Rehabilitación Oral", code: "REH-021", name: "Corona Zirconia", basePrice: 290 },
  { category: "Rehabilitación Oral", code: "REH-022", name: "Placa miorelajante", basePrice: 350 },
  { category: "Rehabilitación Oral", code: "REH-023", name: "Coronas en PMMA", basePrice: 60 },
  { category: "Rehabilitación Oral", code: "REH-024", name: "Prótesis inmediata superior e inferior", basePrice: 160 },
  { category: "Rehabilitación Oral", code: "REH-025", name: "Prótesis fija de 4 coronas metal porcelana con 2 postes", basePrice: 720 },
]

async function main() {
  console.log(`Iniciando la carga de ${catalogData.length} prestaciones al catálogo...`)

  for (const item of catalogData) {
    // Upsert asegura que si corres el script 2 veces, no se dupliquen los datos.
    await prisma.procedureCatalog.upsert({
      where: { code: item.code }, // Asumiendo que agregaste 'code' a tu modelo como @unique
      update: {
        basePrice: item.basePrice,
        name: item.name,
        category: item.category
      },
      create: {
        code: item.code,
        name: item.name,
        category: item.category,
        basePrice: item.basePrice,
        isActive: true
      },
    })
  }

  console.log('✅ Catálogo cargado exitosamente.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })