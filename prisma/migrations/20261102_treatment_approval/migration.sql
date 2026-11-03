-- Solo CREATE TABLE e índice; no modifica registros existentes.
CREATE TABLE "TreatmentApproval" (
    "id" TEXT NOT NULL,
    "treatmentPlanId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAmount" DOUBLE PRECISION NOT NULL,
    "snapshotHash" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "signatureBase64" TEXT NOT NULL,
    "evidence" JSONB,
    CONSTRAINT "TreatmentApproval_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TreatmentApproval_treatmentPlanId_approvedAt_idx" ON "TreatmentApproval"("treatmentPlanId", "approvedAt");
ALTER TABLE "TreatmentApproval" ADD CONSTRAINT "TreatmentApproval_treatmentPlanId_fkey" FOREIGN KEY ("treatmentPlanId") REFERENCES "TreatmentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
