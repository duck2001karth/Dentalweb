import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: any = {};

    if (patientId) {
      where.patientId = patientId;
    }
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
        { patient: { ci: { contains: search, mode: "insensitive" } } },
      ];
    }

    const plans = await prisma.treatmentPlan.findMany({
      where,
      include: {
        patient: { 
          select: { 
            id: true,
            firstName: true, 
            lastName: true, 
            ci: true,
            convenio: true,
            clinicalDocument: true,
            clinicalNotes: true,
          } 
        },
        doctor: { 
          select: { id: true, name: true, email: true } 
        },
        items: true,
        agreement: true 
      },
      orderBy: { createdAt: "desc" }
    });

    const computedPlans = plans.map((plan) => {
      const agreementDiscount = plan.agreement ? Number(plan.agreement.discountValue) : 0;
      let calculatedSubtotal = 0;

      if (plan.items && plan.items.length > 0) {
        calculatedSubtotal = plan.items.reduce((acc, item) => {
          const cost = Number(item.cost || 0);
          const itemDisc = Number(item.discount || 0);
          const effectiveDisc = itemDisc > 0 ? itemDisc : agreementDiscount;
          return acc + (cost - cost * (effectiveDisc / 100));
        }, 0);
      } else {
        const rawCost = Number(plan.totalCost || 0);
        calculatedSubtotal = rawCost - rawCost * (agreementDiscount / 100);
      }

      const totalPaid = Number(plan.totalPaid || 0);
      const pendingBalance = Math.max(0, calculatedSubtotal - totalPaid);

      return {
        ...plan,
        discount: agreementDiscount,
        totalCost: calculatedSubtotal,
        pendingBalance
      };
    });

    return NextResponse.json(computedPlans);
  } catch (error) {
    console.error("Error GET treatments:", error);
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida para registrar auditoría." },
        { status: 401 }
      );
    }

    const currentUserId = (session.user as any).id;
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor 
      ? forwardedFor.split(",")[0].trim() 
      : headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";

    const body = await req.json();
    const { input } = body; 

    if (!input || !input.patientId || !input.name) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios (Paciente o Nombre)" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const newPlan = await tx.treatmentPlan.create({
        data: {
          name: input.name,
          patientId: input.patientId,
          doctorId: input.doctorId,
          agreementId: input.agreementId || null,
          collaborators: input.collaborators || [],
          status: input.status || "DRAFT",
          totalCost: input.totalCost || 0,
          totalPaid: input.totalPaid || 0,
        },
        include: {
          agreement: true,
          patient: true,
          doctor: true,
          items: true
        }
      });

      // Registro de Auditoría
      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "CREATE_TREATMENT_PLAN",
          entity: "TreatmentPlan",
          entityId: newPlan.id,
          patientId: newPlan.patientId,
          details: `Creación de plan de tratamiento: "${newPlan.name}" con costo inicial de $${Number(newPlan.totalCost).toFixed(2)}`,
          oldData: undefined, 
          newData: {
            id: newPlan.id,
            name: newPlan.name,
            status: newPlan.status,
            totalCost: newPlan.totalCost,
            totalPaid: newPlan.totalPaid,
            doctorId: newPlan.doctorId,
            agreementId: newPlan.agreementId,
            collaborators: newPlan.collaborators,
          },
          ipAddress,
          userAgent,
        }
      });

      return newPlan;
    });

    return NextResponse.json({ 
      message: "Plan creado exitosamente", 
      plan: result 
    }, { status: 201 });

  } catch (error) {
    console.error("Error POST treatments:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al crear el plan de tratamiento" },
      { status: 500 }
    );
  }
}