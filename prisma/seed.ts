import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── Default admin account ──────────────────────────────────
  // Email:    admin@marina.com
  // Password: Admin@1234
  // IMPORTANT: change this password immediately after first login.
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);

  await prisma.user.upsert({
    where: { email: 'admin@marina.com' },
    update: {},
    create: {
      fullName: 'Marina Admin',
      email: 'admin@marina.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      preferredLang: 'en',
      emailVerified: true,
    },
  });

  // ── Universities (JSONB bilingual fields) ──────────────────────
  const universities = [
    {
      name: { en: 'University of Rwanda', ar: 'جامعة رواندا' },
      description: {
        en: 'The largest public university in Rwanda, offering programmes across sciences, humanities, medicine, engineering, and education. Formed in 2013 by merging seven public institutions, it has campuses spread across multiple cities.',
        ar: 'أكبر جامعة حكومية في رواندا، تقدم برامج في العلوم والإنسانيات والطب والهندسة والتعليم. تأسست عام 2013 من دمج سبع مؤسسات حكومية ولها أحرام في عدة مدن.',
      },
      city: 'Kigali',
      websiteUrl: 'https://ur.ac.rw',
    },
    {
      name: { en: 'INES Ruhengeri', ar: 'معهد إينيس روهينغيري' },
      description: {
        en: "Institut d'Enseignement Supérieur de Ruhengeri is a Catholic private university located in northern Rwanda in the city of Musanze. It offers undergraduate and postgraduate programmes in science, technology, management, and education, with a calm campus environment close to the Virunga volcanoes.",
        ar: 'معهد التعليم العالي في روهينغيري، جامعة كاثوليكية خاصة تقع في شمال رواندا في مدينة موسانزي. تقدم برامج البكالوريوس والدراسات العليا في العلوم والتكنولوجيا والإدارة والتعليم، في بيئة حرم هادئة قريبة من براكين فيرونغا.',
      },
      city: 'Musanze',
      websiteUrl: 'https://ines.ac.rw',
    },
    {
      name: { en: 'Kigali Independent University (ULK)', ar: 'جامعة كيغالي المستقلة (ULK)' },
      description: {
        en: 'One of the oldest and largest private universities in Rwanda, offering programmes in business administration, law, information technology, and social sciences. ULK has both day and evening sessions, making it accessible for working students.',
        ar: 'إحدى أقدم وأكبر الجامعات الخاصة في رواندا، تقدم برامج في إدارة الأعمال والقانون وتكنولوجيا المعلومات والعلوم الاجتماعية. توفر الجامعة دراسة صباحية ومسائية، مما يجعلها مناسبة للطلاب العاملين.',
      },
      city: 'Kigali',
      websiteUrl: 'https://ulk.ac.rw',
    },
    {
      name: { en: 'Université Libre de Kigali (Unilak)', ar: 'الجامعة الحرة في كيغالي (يونيلاك)' },
      description: {
        en: 'A private francophone university in Kigali offering programmes in law, economics, communication, and computer science. Unilak serves both French and English-speaking students and is known for its affordable tuition fees.',
        ar: 'جامعة خاصة ناطقة بالفرنسية في كيغالي، تقدم برامج في القانون والاقتصاد والإعلام وعلوم الحاسوب. تستقبل يونيلاك الطلاب الفرانكفونيين والأنغلوفونيين وتتميز برسوم دراسية معقولة.',
      },
      city: 'Kigali',
      websiteUrl: 'https://unilak.ac.rw',
    },
    {
      name: { en: 'African Leadership University (ALU)', ar: 'جامعة القيادة الأفريقية' },
      description: {
        en: 'An innovative university focused on developing African leaders and entrepreneurs through a project-based, real-world learning model. ALU offers undergraduate programmes with a strong emphasis on career development and social impact.',
        ar: 'جامعة مبتكرة تركز على تطوير القادة وروّاد الأعمال الأفارقة من خلال نموذج تعليمي قائم على المشاريع والواقع العملي. تقدم ALU برامج البكالوريوس مع تركيز قوي على التطوير المهني والأثر الاجتماعي.',
      },
      city: 'Kigali',
      websiteUrl: 'https://alueducation.com',
    },
    {
      name: { en: 'Mount Kenya University – Rwanda', ar: 'جامعة ماونت كينيا – رواندا' },
      description: {
        en: 'A Kenyan university with a well-established campus in Kigali offering programmes in healthcare, education, hospitality management, and business. Known for its affordable fees, English-medium instruction, and practical curriculum.',
        ar: 'جامعة كينية ذات حرم راسخ في كيغالي، تقدم برامج في الرعاية الصحية والتعليم وإدارة الضيافة والأعمال. تتميز برسومها المعقولة والتدريس باللغة الإنجليزية ومناهجها التطبيقية.',
      },
      city: 'Kigali',
      websiteUrl: 'https://mku.ac.ke',
    },
  ];

  for (const uni of universities) {
    const existing = await prisma.university.findFirst({
      where: { name: { path: ['en'], equals: uni.name.en } },
    });
    if (!existing) await prisma.university.create({ data: uni });
  }

  // ── FAQs (JSONB; document answer rewritten for in-app upload, spec §17) ──
  const faqs = [
    {
      question: { en: 'What documents do I need to apply?', ar: 'ما هي المستندات المطلوبة للتقديم؟' },
      answer: {
        en: 'You will need your secondary school diploma and a clear passport photo. Once your application is submitted, you can securely upload both documents directly from your student dashboard — no WhatsApp needed.',
        ar: 'ستحتاج إلى شهادة الثانوية العامة وصورة واضحة لجواز السفر. بعد تقديم طلبك، يمكنك رفع كلا الوثيقتين بأمان مباشرة من لوحة تحكم الطالب الخاصة بك — دون الحاجة لواتساب.',
      },
      sortOrder: 1,
    },
    {
      question: { en: 'How long does the application process take?', ar: 'كم يستغرق إجراء التقديم؟' },
      answer: {
        en: 'The full process from submitting your application to receiving an admission letter typically takes 4 to 8 weeks, depending on the university and how quickly your documents are ready.',
        ar: 'تستغرق العملية الكاملة من تقديم الطلب إلى استلام خطاب القبول عادةً من 4 إلى 8 أسابيع، وذلك حسب الجامعة وسرعة جاهزية وثائقك.',
      },
      sortOrder: 2,
    },
    {
      question: { en: 'How do I pay the service fee?', ar: 'كيف أدفع رسوم الخدمة؟' },
      answer: {
        en: 'After we review your application, our team will inform you of the service fee. You pay via bank transfer, then send proof of payment to us on WhatsApp. Our admin will confirm your payment manually in the system.',
        ar: 'بعد مراجعة طلبك، سيُعلمك فريقنا برسوم الخدمة. تسدد الدفع عبر التحويل المصرفي، ثم ترسل إيصال الدفع إلينا عبر واتساب. سيقوم مسؤولنا بتأكيد دفعتك يدوياً في النظام.',
      },
      sortOrder: 3,
    },
    {
      question: { en: 'Can I apply to more than one university?', ar: 'هل يمكنني التقديم لأكثر من جامعة؟' },
      answer: {
        en: 'Yes. You can submit separate applications to multiple Rwandan universities through your student dashboard. Each application is tracked independently.',
        ar: 'نعم. يمكنك تقديم طلبات منفصلة لعدة جامعات رواندية من خلال لوحة تحكم الطالب. يتم تتبع كل طلب بشكل مستقل.',
      },
      sortOrder: 4,
    },
    {
      question: { en: 'Will I get help with the student visa?', ar: 'هل سأحصل على مساعدة في تأشيرة الطالب؟' },
      answer: {
        en: 'Yes. Once your admission is confirmed, we guide you step by step through the Rwandan student permit application via the Directorate General of Immigration.',
        ar: 'نعم. بمجرد تأكيد قبولك، نرشدك خطوة بخطوة خلال إجراءات التقديم للحصول على تصريح الطالب في رواندا عبر المديرية العامة للهجرة.',
      },
      sortOrder: 5,
    },
    {
      question: { en: 'Is there an age limit to apply?', ar: 'هل هناك حد أدنى أو أقصى للعمر للتقديم؟' },
      answer: {
        en: 'No, there is no age limit. Rwandan universities welcome international students of all ages as long as they meet the academic entry requirements.',
        ar: 'لا، لا يوجد حد للعمر. ترحب الجامعات الرواندية بالطلاب الدوليين من جميع الأعمار طالما استوفوا متطلبات القبول الأكاديمية.',
      },
      sortOrder: 6,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({
      where: { question: { path: ['en'], equals: faq.question.en } },
    });
    if (!existing) await prisma.faq.create({ data: faq });
  }

  // ── Country info (JSONB) ────────────────────────────────────
  const countryInfo = [
    {
      sectionKey: 'overview',
      title: { en: 'Overview of Rwanda', ar: 'نظرة عامة على رواندا' },
      content: {
        en: 'Rwanda is a landlocked country in East-Central Africa, bordering Uganda, Tanzania, Burundi, and the Democratic Republic of Congo. Known as "The Land of a Thousand Hills," it is one of the fastest-growing economies on the continent and is widely praised for its clean cities, safety, and strong governance.',
        ar: 'رواندا دولة حبيسة في وسط شرق أفريقيا، تحدّها أوغندا وتنزانيا وبوروندي وجمهورية الكونغو الديمقراطية. تُعرف بـ"أرض الألف تل"، وهي من أسرع الاقتصادات نمواً في القارة، وتحظى بسمعة واسعة في مجال نظافة مدنها وأمنها وجودة حوكمتها.',
      },
      sortOrder: 1,
    },
    {
      sectionKey: 'education_system',
      title: { en: 'The Education System', ar: 'نظام التعليم' },
      content: {
        en: 'Rwanda has a rapidly developing higher education sector overseen by the Higher Education Council (HEC). The academic year runs from September to June. Programmes are offered in English, French, and Kinyarwanda. Rwanda shifted to English-medium education in 2009, making it accessible to students from the Arab world and beyond.',
        ar: 'تمتلك رواندا قطاع تعليم عالٍ سريع التطور يشرف عليه مجلس التعليم العالي. يبدأ العام الدراسي في سبتمبر وينتهي في يونيو. تُقدَّم البرامج باللغات الإنجليزية والفرنسية والكينيارواندية. تبنّت رواندا نظام التعليم باللغة الإنجليزية عام 2009، مما يجعلها في متناول الطلاب من الوطن العربي وسائر أنحاء العالم.',
      },
      sortOrder: 2,
    },
    {
      sectionKey: 'cost_of_living',
      title: { en: 'Cost of Living', ar: 'تكلفة المعيشة' },
      content: {
        en: 'Kigali is one of the cleanest and safest capital cities in Africa. Monthly student living expenses — including accommodation, food, and local transport — typically range from USD 300 to USD 600 depending on lifestyle. Campuses outside Kigali such as INES Ruhengeri in Musanze offer a noticeably lower cost of living.',
        ar: 'تُعدّ كيغالي من أنظف العواصم وأكثرها أماناً في أفريقيا. تتراوح النفقات الشهرية للطالب، بما فيها السكن والطعام والمواصلات المحلية، عادةً بين 300 و600 دولار أمريكي حسب نمط الحياة. توفر الأحرام خارج كيغالي كمعهد إينيس روهينغيري في موسانزي تكلفة معيشة أقل بشكل ملحوظ.',
      },
      sortOrder: 3,
    },
    {
      sectionKey: 'visa',
      title: { en: 'Student Visa & Permit', ar: 'تأشيرة الطالب وتصريح الإقامة' },
      content: {
        en: 'Most nationalities can enter Rwanda visa-free for up to 30 days. For study purposes, a student permit is required and is applied for through the Directorate General of Immigration and Emigration (DGIE) after receiving your official admission letter. Our agency assists students throughout this process.',
        ar: 'يمكن لمعظم الجنسيات دخول رواندا بدون تأشيرة لمدة تصل إلى 30 يوماً. لأغراض الدراسة، يُشترط الحصول على تصريح إقامة طالب، ويُقدَّم الطلب عبر المديرية العامة للهجرة والإقامة (DGIE) بعد استلام خطاب القبول الرسمي. تساعد وكالتنا الطلاب طوال هذه العملية.',
      },
      sortOrder: 4,
    },
    {
      sectionKey: 'culture',
      title: { en: 'Culture & Student Life', ar: 'الثقافة وحياة الطالب' },
      content: {
        en: 'Rwanda is a welcoming country with a strong sense of community. Kigali has a growing international student scene with restaurants, mosques, and cultural centres serving people from across Africa and the Arab world. The country is predominantly Christian but fully respects all religions, including Islam.',
        ar: 'رواندا بلد مُرحِّب يتمتع بروح مجتمعية قوية. تضم كيغالي مجتمعاً طلابياً دولياً متنامياً مع مطاعم ومساجد ومراكز ثقافية تخدم القادمين من أنحاء أفريقيا والوطن العربي. البلاد ذات أغلبية مسيحية لكنها تحترم جميع الأديان بما فيها الإسلام.',
      },
      sortOrder: 5,
    },
  ];

  for (const section of countryInfo) {
    await prisma.countryInfo.upsert({
      where: { sectionKey: section.sectionKey },
      update: {},
      create: section,
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Admin login → admin@marina.com / Admin@1234 (change this immediately)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
