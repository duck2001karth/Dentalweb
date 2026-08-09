import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import { prisma } from "@/lib/db" 

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    
    const body = await request.json()
    const { input } = body

    if (!input) {
      return NextResponse.json({ error: "Datos de entrada no proporcionados" }, { status: 400 })
    }

    const patientDataToSave = {
      firstName: input.firstName,
      lastName: input.lastName,
      ci: input.ci || input.rut, 
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      
      tipoRegistro: input.tipoRegistro || undefined,
      cedulaAcudiente: input.cedulaAcudiente || undefined,
      tipoIdentificacion: input.tipoIdentificacion || undefined,
      nombreSocial: input.nombreSocial || undefined,
      sexo: input.sexo || undefined,
      grupoSanguineo: input.grupoSanguineo || undefined,
      pertenenciaEtnica: input.pertenenciaEtnica || undefined,
      estadoCivil: input.estadoCivil || undefined,
      nivelEducativo: input.nivelEducativo || undefined,
      profesion: input.profesion || undefined,
      tipoPaciente: input.tipoPaciente || undefined,
      eps: input.eps || undefined,
      email: input.email || undefined,
      address: input.address || undefined,
      ciudad: input.ciudad || undefined,
      departamento: input.departamento || undefined,
      zonaResidencia: input.zonaResidencia || undefined,
      telefonoFijo: input.telefonoFijo || undefined,
      phone: input.phone || undefined,
      nombreAcompanante: input.nombreAcompanante || undefined,
      telefonoAcompanante: input.telefonoAcompanante || undefined,
      nombreResponsable: input.nombreResponsable || undefined,
      convenio: input.convenio || undefined,
      gestante: input.gestante === true, 
      observaciones: input.observaciones || undefined,
      
      medicalAlerts: input.medicalAlerts || undefined,
    }

    if (!patientDataToSave.ci) {
       return NextResponse.json({ error: "El campo Cédula de Identidad (CI) es obligatorio." }, { status: 400 })
    }

    const newPatient = await prisma.patient.create({
      data: patientDataToSave,
    })
    
    return NextResponse.json({ patient: newPatient }, { status: 201 })

  } catch (error: any) {
    console.error("[PATIENTS_POST_ERROR]", error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Ya existe un paciente registrado con ese CI/Identificación." }, 
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Error interno del servidor al crear el paciente" }, 
      { status: 500 }
    )
  }
}


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let whereClause = {
      isDeleted: false,
    }

    if (search) {
      whereClause = {
        ...whereClause,
        // @ts-ignore
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { ci: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50, 
    })

    return NextResponse.json({ patients })
  } catch (error) {
    console.error("[PATIENTS_GET_ERROR]", error)
    return NextResponse.json({ error: "Error al obtener pacientes" }, { status: 500 })
  }
}