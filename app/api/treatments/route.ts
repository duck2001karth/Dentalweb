import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
    const body = await req.json();
    const { input } = body; 

    if (!input || !input.patientId || !input.name) {
      return NextResponse.json({ error: "Faltan datos obligatorios (Paciente o Nombre)" }, { status: 400 });
    }

    const newPlan = await prisma.treatmentPlan.create({
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

    return NextResponse.json({ 
      message: "Plan creado exitosamente", 
      plan: newPlan 
    }, { status: 201 });

  } catch (error) {
    console.error("Error POST treatments:", error);
    return NextResponse.json({ error: "Ocurrió un error al crear el plan de tratamiento" }, { status: 500 });
  }
}