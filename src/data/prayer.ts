import type { Mission } from '@/data/missions';

// Editorial content for /pray: how supporters can pray for the work Garden Ministries is doing.
// This is informational ministry content, not a prayer-request platform — nothing is submitted or managed here.
// Source: the owner-provided "Prayer Requests" material (Fotos/info, 2026-09), rewritten so each point reads as a
// prayer rather than a claim about Garden's operations or results. Update this file when Garden provides new
// information. Editorial decisions: docs/website/CONTENT-EXPANSION-PLAN.md.

type Localized = { en: string; es: string };

export type PrayerPoint = {
  title: Localized;
  text: Localized;
};

export type PrayerCategory = {
  /** Section anchor on /pray; equals the mission slug so mission pages can link to /pray/#<slug>. */
  id: Mission['slug'];
  title: Localized;
  /** What Garden is doing in this area, then how to pray for it. */
  intro: Localized;
  points: PrayerPoint[];
};

/** Month the prayer points were last reviewed (YYYY-MM); rendered as "September 2026" / "septiembre de 2026". */
export const prayerUpdated = '2026-09';

export const prayerCategories: PrayerCategory[] = [
  {
    id: 'local-family-care',
    title: { en: 'Local Family Care', es: 'Apoyo a familias locales' },
    intro: {
      en: 'Garden Ministries offers practical support to families in Idaho communities facing financial strain and everyday needs. Pray for these families and for the care they receive.',
      es: 'Garden Ministries brinda apoyo práctico a familias de comunidades de Idaho que enfrentan dificultades económicas y necesidades cotidianas. Ora por estas familias y por el cuidado que reciben.',
    },
    points: [
      {
        title: { en: 'Families under financial strain', es: 'Familias en dificultad económica' },
        text: {
          en: 'Intercede for families burdened by unemployment, unexpected medical bills, or poverty. Pray for timely provision, wisdom with finances, and new doors of opportunity.',
          es: 'Intercedamos por las familias agobiadas por el desempleo, gastos médicos inesperados o la pobreza. Oremos por provisión oportuna, sabiduría para administrar sus recursos y nuevas puertas de oportunidad.',
        },
      },
      {
        title: { en: 'Our food programs', es: 'Nuestros programas de alimentación' },
        text: {
          en: 'Pray for our food programs, so children can keep receiving a meal before they go to school.',
          es: 'Oremos por nuestros programas de alimentación, para que los niños sigan recibiendo una comida antes de ir a la escuela.',
        },
      },
    ],
  },
  {
    id: 'community-water',
    title: { en: 'Community Water & Relief', es: 'Agua y ayuda comunitaria' },
    intro: {
      en: 'Through trusted partners, Garden Ministries supports water access and humanitarian relief for communities in need. Pray for these communities, for families facing disaster, and for those bringing relief.',
      es: 'A través de aliados de confianza, Garden Ministries apoya el acceso al agua y la ayuda humanitaria para comunidades necesitadas. Ora por estas comunidades, por las familias que enfrentan desastres y por quienes llevan ayuda.',
    },
    points: [
      {
        title: { en: 'Families in grief after the earthquakes in Venezuela', es: 'Familias en duelo tras los terremotos en Venezuela' },
        text: {
          en: 'Pray for families walking through the painful loss of a spouse, child, or close relative during the back-to-back earthquakes of June 24, 2026, in Venezuela. Ask God to comfort them and surround them with care.',
          es: 'Oremos por las familias que atraviesan el dolor de haber perdido a su esposo o esposa, a un hijo o a un ser querido en los terremotos consecutivos del 24 de junio de 2026 en Venezuela. Pidamos a Dios que las consuele y las rodee de cuidado.',
        },
      },
      {
        title: { en: 'Safe water', es: 'Agua segura' },
        text: {
          en: 'Pray for communities living with chronic water scarcity, drought, or contaminated supplies. Ask God to reveal underground water sources and open doors for wells to be completed.',
          es: 'Oremos por las comunidades que sufren escasez crónica de agua, sequía o fuentes contaminadas. Pidamos a Dios que revele fuentes de agua subterránea y abra puertas para que se completen los pozos.',
        },
      },
      {
        title: { en: 'Protection and healing', es: 'Protección y sanidad' },
        text: {
          en: 'Pray for children and families exposed to illness from unsafe water. Ask God for protection, healing, and access to clean water and sanitation.',
          es: 'Oremos por los niños y las familias expuestos a enfermedades por el agua insalubre. Pidamos a Dios protección, sanidad y acceso a agua limpia y saneamiento.',
        },
      },
      {
        title: { en: 'Time to learn', es: 'Tiempo para aprender' },
        text: {
          en: 'Pray that as clean water comes closer to home, children—especially girls who spend long hours gathering water—would have more time to learn and grow.',
          es: 'Oremos para que, a medida que el agua limpia llegue más cerca de casa, los niños —especialmente las niñas que pasan largas horas acarreando agua— tengan más tiempo para aprender y crecer.',
        },
      },
      {
        title: { en: 'Safe passage for relief', es: 'Paso seguro para la ayuda' },
        text: {
          en: 'During natural disasters, conflict, or severe drought, pray for access to cut-off areas: that roads would open, delays would clear, and relief would travel safely.',
          es: 'En medio de desastres naturales, conflictos o sequías severas, oremos por acceso a las zonas incomunicadas: que se abran los caminos, se superen los retrasos y la ayuda llegue con seguridad.',
        },
      },
      {
        title: { en: 'Families who have lost their homes', es: 'Familias que perdieron su hogar' },
        text: {
          en: 'Pray for displaced families to receive clean drinking water, food, safe shelter, and medical care without delay.',
          es: 'Oremos por las familias desplazadas, para que reciban pronto agua potable, alimento, un refugio seguro y atención médica.',
        },
      },
      {
        title: { en: 'Rebuilding', es: 'Reconstrucción' },
        text: {
          en: 'Pray for communities rebuilding after disaster, and for the people, resources, and skills needed to restore damaged water systems and community infrastructure.',
          es: 'Oremos por las comunidades que se reconstruyen después de un desastre, y por las personas, los recursos y la capacidad necesarios para restaurar sus sistemas de agua y su infraestructura comunitaria.',
        },
      },
    ],
  },
  {
    id: 'ministry-strengthening',
    title: { en: 'Strengthening Those Who Serve in the Ministry', es: 'Fortalecer a quienes sirven en el ministerio' },
    intro: {
      en: 'Garden Ministries supports pastors, leaders, and ministry workers who carry the needs of others. Pray for their strength, wisdom, families, and ministry.',
      es: 'Garden Ministries apoya a pastores, líderes y servidores que cargan con las necesidades de otros. Ora por sus fuerzas, su sabiduría, sus familias y su ministerio.',
    },
    points: [
      {
        title: { en: 'Renewed strength', es: 'Fuerzas renovadas' },
        text: {
          // Isaiah 40:31 — EN: KJV; ES: Reina-Valera 1960.
          en: 'Pray that God replaces weariness and burnout with strength only He can give, as promised in Isaiah 40:31: “they shall run, and not be weary; and they shall walk, and not faint.”',
          es: 'Oremos para que Dios cambie el cansancio y el agotamiento por las fuerzas que solo Él puede dar, como lo promete en Isaías 40:31: «correrán, y no se cansarán; caminarán, y no se fatigarán».',
        },
      },
      {
        title: { en: 'Wisdom in leadership', es: 'Sabiduría para liderar' },
        text: {
          en: 'Ask God to give clear direction for daily decisions, administrative challenges, and the counsel they offer others.',
          es: 'Pidamos a Dios dirección clara para las decisiones diarias, los retos administrativos y el consejo que brindan a otros.',
        },
      },
      {
        title: { en: 'Courage and pure motives', es: 'Valentía y motivaciones puras' },
        text: {
          en: 'Pray that they speak the truth without fear of others or pressure from culture, keeping their eyes on Christ rather than on personal recognition.',
          es: 'Oremos para que hablen la verdad sin temor a los hombres ni a la presión de la cultura, con los ojos puestos en Cristo y no en el reconocimiento personal.',
        },
      },
      {
        title: { en: 'Marriages and families', es: 'Matrimonios y familias' },
        text: {
          en: 'Pray for protection over the marriages and families of those in ministry, who often live under constant attention, and for realistic expectations from their congregations.',
          es: 'Oremos por protección sobre los matrimonios y las familias de quienes sirven en el ministerio, que muchas veces viven bajo la mirada constante de los demás, y por expectativas realistas de parte de sus congregaciones.',
        },
      },
    ],
  },
];
