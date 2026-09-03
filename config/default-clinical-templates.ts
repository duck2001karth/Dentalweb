import { ClinicalDocType, DocumentTemplateFormData } from "@/types/clinical-templates"

export interface PredefinedTemplate extends DocumentTemplateFormData {
  id: string
  description: string
}

export const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  // 1. ENDODONCIA
  {
    id: "consent-endodoncia",
    title: "Consentimiento Informado para Tratamiento de Endodoncia",
    type: "CONSENT",
    category: "Endodoncia",
    description: "Tratamiento de conductos, remoción pulpar y descargo de riesgos por anestesia, hipoclorito e instrumental.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `Por medio del presente documento hago constar lo siguiente:

• He acudido a la Clínica {{clinica_nombre}}, donde he sido atendido/a por el/la Dr(a). {{doctor_nombre}}.
• He sido informado/a que después de la evaluación diagnóstica requiero atención clínica endodóntica en las piezas dentarias indicadas en mi plan de tratamiento.
• Se me ha explicado de forma clara la naturaleza de la afección pulpar/periapical que padezco, así como las opciones terapéuticas, riesgos asociados y pronóstico.
• Acepto la toma de imágenes radiográficas necesarias para completar un tratamiento adecuado.
• Me fueron expuestos los riesgos del uso de anestesia local (alergias, anestesia prolongada o hematomas) y los posibles accidentes por irrigantes químicos (como hipoclorito de sodio).
• Comprendo que el objetivo primordial es la eliminación del tejido pulpar inflamado o infectado y el sellado tridimensional del conducto radicular para conservar la pieza dental.
• Entiendo que tras la intervención puedo experimentar inflamación, dolor local o limitación temporal en la apertura bucal.
• Conozco la posibilidad de accidentes anatómicos como fractura instrumental en conductos calcificados o curvos, perforaciones radiculares o persistencia infecciosa que obligue a cirugía apical (apicectomía) o exodoncia.
• Comprendo que tras la endodoncia la pieza queda desvitalizada y propensa a fracturas, siendo indispensable realizar su reconstrucción definitiva o corona protésica a la brevedad.

Extiendo mi confianza al profesional tratante y autorizo la ejecución del procedimiento endodóntico.`,
  },

  // 2. ORTODONCIA
  {
    id: "consent-ortodoncia",
    title: "Consentimiento Informado para Tratamiento de Ortodoncia",
    type: "CONSENT",
    category: "Ortodoncia",
    description: "Aparatología fija/removible, fuerzas biomecánicas, despegue de brackets, higiene y fase de contención.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `El/la Ortodoncista Dr(a). {{doctor_nombre}} de {{clinica_nombre}} me ha explicado las implicaciones del tratamiento ortodóncico:

1. La colocación de aparatología genera una respuesta biológica con inflamación y molestia inicial en los dientes, la cual remite progresivamente.
2. Si los brackets no se cuidan con rigurosidad pueden desprenderse, lo cual retrasa el tratamiento y genera costos de reposición.
3. Se pueden presentar rozaduras, aftas o ulceraciones temporales en mejillas, labios o lengua durante la adaptación.
4. Una higiene oral deficiente provocará descalcificaciones irreversibles (manchas blancas en esmalte), caries interproximales o inflamación de las encías.
5. El patrón biológico de crecimiento maxilomandibular o erupción dentaria puede requerir adaptaciones del plan, incluyendo extracciones seriadas o ajuste de tiempos previstos.
6. Existe susceptibilidad individual a reabsorciones radiculares leves en dientes sometidos a fuerzas mecánicas.
7. Posibilidad de molestias en la articulación temporomandibular (ATM) secundarias a la modificación de la oclusión o a hábitos previos de bruxismo.
8. En dientes retenidos o incluidos existen dificultades técnicas añadidas como posibles daños radiculares vecinos o anquilosis ósea.
9. Se me advierte del riesgo de recidiva o desalineación dental si no utilizo disciplinadamente los retenedores de contención una vez retirados los aparatos.
10. Acepto la toma de fotografías de control, modelos y estudios radiológicos para la custodia de mi expediente clínico.

RECOMENDACIONES: Evitar alimentos duros, pegajosos o morder objetos extraños; extremar el cepillado dental y acudir con puntualidad a las citas de control mensual.`,
  },

  // 3. EXODONCIA DE DIENTES ERUPCIONADOS
  {
    id: "consent-exodoncia-erupcionados",
    title: "Consentimiento Informado para Exodoncia de Dientes Erupcionados",
    type: "CONSENT",
    category: "Cirugía Oral",
    description: "Extracción simple o quirúrgica de órganos dentales erupcionados y manejo de complicaciones postoperatorias.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `DESCRIPCIÓN DEL PROCEDIMIENTO:
Se me ha informado la necesidad de realizar la extracción (exodoncia) de órgano(s) dental(es) erupcionado(s) por motivos diagnósticos tales como caries no restaurables, enfermedad periodontal avanzada, fracturas radiculares, focos infecciosos o indicación ortodóncica/protésica.

BENEFICIOS Y ALTERNATIVAS:
Comprendo que la extracción busca suprimir focos infecciosos o dolorosos y prevenir complicaciones en piezas vecinas. Se me explicaron alternativas viables (cuando aplican) con sus ventajas y pronósticos.

RIESGOS Y COMPLICACIONES:
Entiendo que el procedimiento implica riesgos postoperatorios inherentes:
• Dolor, sangrado o hematomas en tejidos periorales.
• Inflamación o trismus muscular (dificultad para abrir la boca).
• Alveolitis (infección o pérdida prematura del coágulo en el alvéolo).
• Fractura accidental de raíces que obligue a abordaje quirúrgico con osteotomía.
• Proximidad al seno maxilar en molares superiores (riesgo de comunicación bucosinusal).
• Parestesias transitorias en labios o lengua en casos excepcionales.

Autorizo la administración de anestesia local y la realización de los procedimientos complementarios que requiera el odontólogo tratante durante la intervención quirúrgica.`,
  },

  // 4. RESTAURACIONES DENTALES SIMPLES
  {
    id: "consent-restauraciones-simples",
    title: "Consentimiento Informado para Restauraciones Dentales Simples",
    type: "CONSENT",
    category: "Operatoria Dental",
    description: "Operatoria dental directa con resinas compuestas, remoción de caries superficial/media y ajuste oclusal.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `Se ha determinado la necesidad de realizar restauraciones dentales simples por motivo de caries incipientes o medias, fracturas menores, abrasión cervical o reemplazo de obturaciones defectuosas.

DESCRIPCIÓN:
El tratamiento consiste en la eliminación del tejido cariado o debilitado, desinfección cavitaria, aplicación de agentes adhesivos biocompatibles y colocación de resinas fotopolimerizables para restaurar anatomía, función y estética oclusal.

RIESGOS Y COMPLICACIONES:
• Sensibilidad dentaria transitoria al frío o calor tras la polimerización del material.
• Posible desajuste o fractura de la restauración ante masticación de elementos duros.
• Necesidad de retoques de oclusión posteriores para eliminar puntos altos de contacto.
• Posibilidad de compromiso pulpar no evidente previamente que demande endodoncia posterior.

Me comprometo a mantener una adecuada higiene oral con cepillado e hilo dental y asistir a revisiones periódicas para verificar la integridad marginal de la restauración.`,
  },

  // 5. RESTAURACIONES DENTALES COMPLEJAS
  {
    id: "consent-restauraciones-complejas",
    title: "Consentimiento Informado para Restauraciones Dentales Complejas",
    type: "CONSENT",
    category: "Operatoria Dental",
    description: "Reconstrucciones directas/indirectas extensas con pérdida severa de estructura dental y protección cuspídea.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `Se me ha informado que la(s) pieza(s) dental(es) a tratar presenta(n) una pérdida extensa de estructura por caries profunda, fracturas cuspídeas o desgastes severos, demandando una restauración compleja (reconstrucción coronaria directa, incrustación o recubrimiento cuspídeo).

DETALLES DEL TRATAMIENTO:
El procedimiento exige la eliminación completa del tejido enfermo, regularización de paredes remanentes y reconstrucción anatómica con materiales de alta resistencia estructural bajo aislamiento y anestesia local.

RIESGOS Y LÍMITES BIOLÓGICOS:
• Sensibilidad dentaria postoperatoria que puede prolongarse varios días debido a la proximidad con la cámara pulpar.
• Inflamación o necrosis pulpar asintomática preexistente que haga inevitable realizar tratamiento de conductos (endodoncia).
• Riesgo de microfiltración marginal, fractura de cúspides remanentes debilitadas o desprendimiento del material si no se protege con una prótesis fija.
• Si el remanente biológico no resiste las fuerzas funcionales de la masticación, se me ha advertido que el plan alternativo derivará en una corona protésica o exodoncia.

Otorgo mi consentimiento informado comprendiendo que el éxito depende también de mis hábitos masticatorios e higiénicos.`,
  },

  // 6. PROFILAXIS DENTAL
  {
    id: "consent-profilaxis",
    title: "Consentimiento Informado para Profilaxis Dental",
    type: "CONSENT",
    category: "Prevención",
    description: "Limpieza profesional con ultrasonido, copas profilácticas, remoción de biofilm bacteriano y pulido coronal.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `DECLARACIÓN DEL PROCEDIMIENTO:
Consiento la realización de una profilaxis dental profesional, procedimiento preventivo destinado a la remoción mecánica de placa bacteriana, manchas extrínsecas por alimentos y depósitos blandos mediante instrumental ultrasónico y pastas abrasivas controladas.

ALCANCES Y MOLESTIAS ESPERADAS:
• El procedimiento previene la aparición de caries y el inicio de cuadros de gingivitis o periodontitis.
• Pueden manifestarse molestias leves transitorias como hipersensibilidad al agua fría del ultrasonido, sangrado gingival en zonas inflamadas o sensación de aspereza momentánea.
• Comprendo que la profilaxis de rutina no sustituye tratamientos especializados como el raspado y alisado radicular profundo en casos de enfermedad periodontal establecida.

Me comprometo a seguir las pautas de higiene domiciliaria instruidas por el profesional tratante.`,
  },

  // 7. ACLARAMIENTO (BLANQUEAMIENTO) DENTAL
  {
    id: "consent-aclaramiento",
    title: "Consentimiento Informado para Aclaramiento Dental",
    type: "CONSENT",
    category: "Estética Dental",
    description: "Aplicación de agentes químicos oxidantes a base de peróxidos para modificación del color dental.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `ALCANCES DEL TRATAMIENTO:
Autorizo la realización del aclaramiento dental en consultorio o ambulatorio mediante la aplicación controlada de geles oxidantes a base de peróxido de hidrógeno o peróxido de carbamida.

ADVERTENCIAS Y LÍMITES:
• Los resultados son individuales y dependen de factores como la saturación previa del esmalte/dentina, fluorosis, edad y consumo de pigmentos. No es posible garantizar una tonalidad cromática específica.
• El tratamiento aclara únicamente dientes naturales. Las restauraciones de resina, coronas, carillas o prótesis NO cambian de color y requerirán cambio posterior si se desea uniformidad estética.
• Durante el proceso o tras su conclusión es común experimentar sensibilidad transitoria al frío/calor o irritación química reversible en márgenes gingivales.
• Durante las primeras 48 horas tras cada sesión queda terminantemente prohibido consumir tabaco, café, té, gaseosas oscuras, vino tinto o alimentos con colorantes intensos.

Comprendo las indicaciones y autorizo el inicio del protocolo estético.`,
  },

  // 8. RECUBRIMIENTO PULPAR INDIRECTO
  {
    id: "consent-recubrimiento-pulpar",
    title: "Consentimiento Informado para Recubrimiento Pulpar Indirecto",
    type: "CONSENT",
    category: "Operatoria Dental",
    description: "Tratamiento biológico conservador en caries profundas para inducir puente dentinario y preservar la vitalidad.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `Se me ha explicado que el recubrimiento pulpar indirecto es una terapia biológica conservadora indicada en lesiones de caries muy profundas, con la finalidad de evitar una exposición pulpar accidental y mantener la vitalidad del diente.

PROCEDIMIENTO:
Se remueve la mayor parte del tejido cariado dejando una delgada capa de dentina desmineralizada próxima a la cámara pulpar, sobre la cual se coloca un material bioactivo (como hidróxido de calcio o silicato de calcio / biocerámicos) para inducir dentinogénesis y sellar la cavidad.

RIESGOS BIOLÓGICOS:
• Sensibilidad postoperatoria leve o moderada al frío y a la masticación.
• Fracaso biológico por afectación pulpar irreversible previa que termine en necrosis o pulpitis, lo cual demandará endodoncia o exodoncia si el diente no fuese viable.
• Fractura de la restauración provisional o definitiva si no se cuida la masticación en la zona.

Acepto este tratamiento de preservación conociendo sus posibilidades de éxito y sus riesgos inherentes.`,
  },

  // 9. PULPECTOMÍA (ODONTOPEDIATRÍA)
  {
    id: "consent-pulpectomia",
    title: "Consentimiento Informado para Pulpectomía (Dientes Temporales)",
    type: "CONSENT",
    category: "Odontopediatría",
    description: "Tratamiento conducticular en dientes deciduos con material reabsorbible para mantener el espacio de la dentición permanente.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `DESCRIPCIÓN:
Autorizo la realización de la pulpectomía en la dentición temporal (de leche) del/la menor paciente, procedimiento necesario cuando la pulpa cameral y radicular presenta inflamación irreversible o necrosis por caries o traumatismo.

OBJETIVO Y PROCEDIMIENTO:
Consiste en la desinfección y relleno de los conductos con un material antiséptico y reabsorbible que no obstaculice la erupción de la pieza definitiva que viene abajo. Permite mantener el diente temporal como mantenedor de espacio natural y preservar la función masticatoria.

COMPLICACIONES ASOCIADAS:
• Molestia transitoria controlable con analgésicos pediátricos.
• Persistencia del foco infeccioso o aparición de fístula en casos de reabsorción patológica, lo cual obligaría a la extracción prematura y colocación de mantenedor de espacio.
• Riesgo mínimo de afectación al germen definitivo si existió infección ósea crónica prolongada previa al tratamiento.

En mi calidad de representante legal, autorizo a la clínica a ejecutar el procedimiento y administrar la anestesia local requerida.`,
  },

  // 10. FRENECTOMÍA
  {
    id: "consent-frenectomia",
    title: "Consentimiento Informado para Cirugía de Frenectomía",
    type: "CONSENT",
    category: "Cirugía Oral",
    description: "Sección o remoción quirúrgica de frenillo labial o lingual por limitaciones funcionales, fonéticas o de ortodoncia.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `NATURALEZA QUIRÚRGICA:
Se me ha diagnosticado una inserción anómala o hipertrofia de frenillo (labial o lingual) que causa limitaciones funcionales (anquiloglosia, dificultades fonéticas), diastemas dentarios o problemas periodontales, requiriéndose una frenectomía o frenotomía correctiva.

PROCEDIMIENTO:
Bajo anestesia local infiltrativa, se secciona o reseca la brida mucosa y muscular mediante bisturí, electrobisturí o láser, cerrando con puntos de sutura absorbible o no absorbible según la técnica elegida.

RIESGOS POSTOPERATORIOS:
• Inflamación de labios o piso de boca y molestias locales durante las primeras 48 horas.
• Hemorragia menor o formación de hematomas en la mucosa tratada.
• Reinserción o cicatrización retráctil si no se realizan los ejercicios de movilidad y terapia miofuncional recomendados.
• Reacciones adversas o alergias a los anestésicos locales o analgésicos prescritos.

Me comprometo a seguir las pautas de reposo, alimentación blanda/fría y acudir al retiro de suturas y control clínico.`,
  },
  // 11. EXTRACCIÓN DE DIENTES INCLUIDOS (Acuerdo Ministerial 5316)
  {
    id: "consent-dientes-incluidos",
    title: "Consentimiento Informado para Extracción de Dientes Incluidos",
    type: "CONSENT",
    category: "Cirugía Oral",
    description: "Extracción quirúrgica de piezas incluidas o impactadas (caninos/molares), quistes asociados y riesgos neurovasculares (Acuerdo Ministerial 5316).",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `Para satisfacción de los derechos del paciente, como instrumento favorecedor del correcto uso de los procedimientos diagnósticos y terapéuticos, conforme al acuerdo ministerial 5316 emitido por el Ministerio de Salud se detalla lo siguiente:

Yo, {{paciente_nombre}}, en pleno uso de mis facultades, libre y voluntariamente, declaro que he sido debidamente informado/a por el/la Dr(a). {{doctor_nombre}} de la Clínica {{clinica_nombre}}; en consecuencia, autorizo para que me sea realizado el procedimiento quirúrgico de extracción de dientes incluidos/impactados o cualquier otro procedimiento complementario que se estime necesario para completar el tratamiento previsto.

NATURALEZA DEL PROCEDIMIENTO:
La cirugía para la extracción de dientes incluidos o impactados se hace necesaria por la frecuente patología derivada de ellos (terceros molares superiores e inferiores, caninos u otras piezas retenidas en el hueso, así como quistes o procesos asociados). La causa primordial es la discrepancia de espacio en la arcada dental. 

COMPLICACIONES Y RIESGOS INHERENTES:
Comprendo que, aunque el procedimiento persigue un indudable beneficio, no está exento de riesgos y complicaciones estadísticas:
• Alergia o intolerancia al anestésico local u otros fármacos administrados antes, durante o después de la intervención.
• Inflamación regional severa, trismus (dificultad de apertura bucal) y formación de hematomas.
• Hemorragia postoperatoria o apertura no deseada de puntos de sutura.
• Daño accidental o compromiso periodontal de órganos dentarios vecinos.
• Falta de sensibilidad parcial o total, temporal o permanente del nervio dentario inferior (parestesia del labio inferior y mentón), nervio lingual (pérdida de sensibilidad y gusto en la lengua) o nervio infraorbitario.
• Infección ósea (osteítis/alveolitis) o de tejidos blandos circunvecinos.
• Proximidad anatómica al seno maxilar con riesgo de sinusitis o comunicación bucosinusal / buconasal.
• Desplazamiento accidental de la pieza dental a espacios anatómicos profundos.
• Ruptura instrumental milimétrica en conductos o cavidades óseas.

DERECHO A REVOCATORIA:
Declaro haber resuelto todas mis dudas en la entrevista previa con el profesional tratante. Este consentimiento puede ser revocado por el paciente o su tutor sin necesidad de justificación alguna en cualquier momento previo a la intervención.`,
  },

  // 12. CIRUGÍA DE TERCEROS MOLARES (ODONTECTOMÍA)
  {
    id: "consent-cirugia-terceros-molares",
    title: "Consentimiento Informado para Cirugía de Terceros Molares",
    type: "CONSENT",
    category: "Cirugía Oral",
    description: "Odontectomía de muelas del juicio retenidas o erupcionadas, protocolo de incisión/osteotomía y protocolo de recuperación de 72 horas.",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
    content: `PROCEDIMIENTO QUIRÚRGICO:
Odontectomía de terceros molares (retenidos, impactados o erupcionados) en hueso maxilar o mandíbula, cuyo diagnóstico ha sido corroborado mediante radiografías panorámicas o tomografías volumétricas.

TÉCNICA OPERATORIA:
Bajo estabilidad hemodinámica y técnica aséptica, se procede con la administración de anestesia local, incisión angular, elevación de colgajo mucoperióstico, ostectomía/odontosección si el eje de erupción lo exige, enucleación de la pieza dental, legrado del lecho óseo, lavado profuso y sutura de la herida.
Duración estimada: Aproximadamente 45 a 60 minutos.

RIESGOS FRECUENTES Y POCO FRECUENTES:
• Frecuentes: Edema facial, hematomas/equimosis, dolor moderado a severo, trismus muscular, sangrado postoperatorio y parestesia transitoria por vecindad con el conducto dentario.
• Poco frecuentes (<0.5%): Reacciones anafilácticas al anestésico, infecciones severas de espacios faciales profundos con compromiso de vía aérea, o fractura del ángulo mandibular en inclusiones óseas profundas.
• Consecuencias de no intervenir: Infecciones recurrentes (pericoronaritis), apiñamiento anteroinferior, reabsorción de la raíz del segundo molar, formación de quistes dentígeros o tumores odontogénicos.

CUIDADOS POSTOPERATORIOS Y RECUPERACIÓN:
• Reposo relativo domiciliario durante las primeras 72 horas; no realizar esfuerzos físicos ni exposición a fuentes de calor.
• Aplicación de compresas de hielo local de forma intermitente (máximo 10 minutos por sesión) durante las primeras 8 a 12 horas para minimizar la inflamación.
• Dieta blanda/líquida, hipercalórica y fresca, evitando el uso de sorbetes o pajillas.
• Cumplir estrictamente la pauta farmacológica prescrita (analgésicos, antiinflamatorios y antibióticos) y realizar enjuagues antisépticos después de las 24 horas.

AUTORIZACIÓN:
Confirmo que he facilitado la información fidedigna sobre mis antecedentes médicos y alergias. Acepto libremente el procedimiento propuesto y conozco mi derecho a retirar o revocar este consentimiento cuando lo considere oportuno.`,
  },
]