export type Mission = {
  slug: string;
  tone: 'sage' | 'clay' | 'gold';
  icon: 'heart-handshake' | 'droplets' | 'church';
  category: { en: string; es: string };
  title: { en: string; es: string };
  summary: { en: string; es: string };
  status: { en: string; es: string };
  location: { en: string; es: string };
  need: { en: string; es: string };
  response: { en: string; es: string };
  evidence: { en: string; es: string };
};

export const missions: Mission[] = [
  {
    slug: 'local-family-care',
    tone: 'sage',
    icon: 'heart-handshake',
    category: { en: 'Local care', es: 'Ayuda local' },
    title: { en: 'Local Family Care', es: 'Apoyo a familias locales' },
    summary: {
      en: 'Practical support for families facing food, transportation, housing, medical, or essential-service needs.',
      es: 'Apoyo práctico para familias con necesidades de alimento, transporte, vivienda, salud o servicios esenciales.',
    },
    status: { en: 'Ongoing', es: 'Continua' },
    location: { en: 'Idaho communities', es: 'Comunidades de Idaho' },
    need: {
      en: 'Families can face urgent needs that do not fit neatly into a single program.',
      es: 'Las familias pueden enfrentar necesidades urgentes que no encajan en un solo programa.',
    },
    response: {
      en: 'Garden responds through trusted local relationships and practical assistance appropriate to each situation.',
      es: 'Garden responde mediante relaciones locales de confianza y ayuda práctica apropiada para cada situación.',
    },
    evidence: {
      en: 'Internal records, receipts, partner confirmation, and public-safe updates when consent is available.',
      es: 'Registros internos, recibos, confirmación de partners y actualizaciones públicas cuando existe consentimiento.',
    },
  },
  {
    slug: 'community-water',
    tone: 'clay',
    icon: 'droplets',
    category: { en: 'Global service', es: 'Servicio global' },
    title: { en: 'Community Water & Relief', es: 'Agua y ayuda comunitaria' },
    summary: {
      en: 'Partner-led support for water access, food, medicine, and humanitarian needs in communities outside major cities.',
      es: 'Apoyo mediante partners para agua, alimentos, medicina y necesidades humanitarias fuera de las ciudades.',
    },
    status: { en: 'Partner-led', es: 'Con partners' },
    location: { en: 'Sensitive locations protected', es: 'Ubicaciones sensibles protegidas' },
    need: {
      en: 'Remote communities may lack reliable access to basic resources and practical humanitarian support.',
      es: 'Comunidades remotas pueden carecer de acceso confiable a recursos básicos y ayuda humanitaria.',
    },
    response: {
      en: 'Garden supports known ministry relationships while protecting locations and identities when disclosure could create risk.',
      es: 'Garden apoya relaciones ministeriales conocidas y protege ubicaciones e identidades cuando divulgar implica riesgo.',
    },
    evidence: {
      en: 'Partner reports and approved documentation are separated into internal, donor, and public-safe versions.',
      es: 'Los reportes y documentos aprobados se separan en versiones internas, para donantes y públicas.',
    },
  },
  {
    slug: 'ministry-strengthening',
    tone: 'gold',
    icon: 'church',
    category: { en: 'Ministry support', es: 'Apoyo ministerial' },
    title: { en: 'Strengthen Those Who Serve', es: 'Fortalecer a quienes sirven' },
    summary: {
      en: 'Resources, training, and mission support for pastors, leaders, house churches, and qualified ministry partners.',
      es: 'Recursos, capacitación y apoyo misionero para pastores, líderes, iglesias de casa y ministerios calificados.',
    },
    status: { en: 'Developing', es: 'En desarrollo' },
    location: { en: 'Local and global partners', es: 'Partners locales y globales' },
    need: {
      en: 'Trusted leaders often know the need but lack the resources or support to respond sustainably.',
      es: 'Líderes confiables conocen la necesidad, pero pueden carecer de recursos para responder sosteniblemente.',
    },
    response: {
      en: 'Garden can connect generosity with approved equipment, materials, training, and mission-related costs.',
      es: 'Garden puede conectar generosidad con equipos, materiales, capacitación y costos misioneros aprobados.',
    },
    evidence: {
      en: 'Verified relationship, documented distribution, ministry update, and appropriate impact evidence.',
      es: 'Relación verificada, distribución documentada, actualización ministerial y evidencia apropiada.',
    },
  },
];
