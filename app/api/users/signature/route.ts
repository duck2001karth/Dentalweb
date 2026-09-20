import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const userData = user as Record<string, any>
    const professionalCard =
      userData.professionalCard ?? userData.licenseNumber ?? ""

    return NextResponse.json({
      signatureBase64: userData.signatureBase64 || null,
      professionalCard,
      specialty: userData.specialty || "Ortodoncia",
    })
  } catch (error) {
    console.error("Error al obtener firma/credenciales:", error)
    return NextResponse.json(
      { error: "Error al recuperar datos" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { signatureBase64, professionalCard, specialty } = body
    const updateData: Record<string, any> = {}

    if (signatureBase64 !== undefined) {
      updateData.signatureBase64 = signatureBase64
    }

    if (specialty !== undefined) {
      updateData.specialty = specialty
    }

    if (professionalCard !== undefined) {
      updateData.professionalCard = professionalCard
    }

    let updatedUser: any

    try {
      updatedUser = await prisma.user.update({
        where: { email },
        data: updateData,
      })
    } catch (dbErr: any) {
      if (
        professionalCard !== undefined &&
        dbErr?.message?.includes("professionalCard")
      ) {
        delete updateData.professionalCard
        updateData.licenseNumber = professionalCard

        updatedUser = await prisma.user.update({
          where: { email },
          data: updateData,
        })
      } else {
        throw dbErr
      }
    }

    const resData = updatedUser as Record<string, any>
    const resolvedCard =
      resData.professionalCard ?? resData.licenseNumber ?? professionalCard ?? ""

    return NextResponse.json({
      success: true,
      signatureBase64: resData.signatureBase64,
      professionalCard: resolvedCard,
      specialty: resData.specialty,
    })
  } catch (error) {
    console.error("Error al actualizar firma/especialidad:", error)
    return NextResponse.json(
      { error: "Error al actualizar las credenciales" },
      { status: 500 }
    )
  }
}