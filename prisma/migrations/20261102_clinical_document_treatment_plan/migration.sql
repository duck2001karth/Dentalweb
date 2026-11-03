-- AlterTable
ALTER TABLE "ClinicalDocument" ADD COLUMN     "treatmentPlanId" TEXT;

-- CreateIndex
CREATE INDEX "ClinicalDocument_treatmentPlanId_idx" ON "ClinicalDocument"("treatmentPlanId");

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_treatmentPlanId_fkey" FOREIGN KEY ("treatmentPlanId") REFERENCES "TreatmentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
