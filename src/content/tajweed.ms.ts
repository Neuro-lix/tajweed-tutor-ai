// Terjemahan Bahasa Melayu (Malaysia) untuk kandungan Tajwid.
// Hanya import jenis (type-only) digunakan untuk mengelakkan kitaran import masa larian.
import type { HubContent, PillarSlug, TopicContent } from './tajweed';
import type {
  ExtraTopicSlug,
  FaqPageStrings,
  LinkBlockStrings,
  QuizQuestion,
  QuizStrings,
} from './tajweedExtra';

export const msDict: { hub: HubContent; topics: Record<PillarSlug, TopicContent> } = {
  hub: {
    metaTitle: 'Hukum tajwid: makharij, sifat dan mad dijelaskan',
    metaDescription:
      'Panduan lengkap hukum tajwid: makharij huruf, sifat huruf, mad, nun sakinah dan waqaf, lengkap dengan contoh ayat al-Quran.',
    h1: 'Hukum tajwid: makharij, sifat dan mad',
    intro:
      'Belajar tajwid bermakna memberi hak kepada setiap huruf al-Quran. Panduan ini menghimpunkan hukum-hukum penting — makhraj huruf, sifat huruf, mad, nun sakinah dan waqaf — lengkap dengan contoh daripada mushaf, supaya anda dapat melangkah ke arah bacaan yang tepat mengikut sepuluh Qiraat.',
    topicsHeading: 'Tiga tunjang tajwid',
    topicsIntro: 'Setiap tunjang mempunyai pelajaran terperinci lengkap dengan hukum, contoh al-Quran dan kesilapan yang sering berlaku.',
    moreHeading: 'Hukum sambungan dan waqaf',
    faqHeading: 'Soalan lazim',
    ctaTitle: 'Amalkan hukum-hukum ini mulai hari ini',
    ctaText:
      'Bacakan satu ayat, AI akan menranskripsikan bacaan anda, mengesan kesilapan makharij, mad dan ghunnah, kemudian meminta anda mengulang tepat pada bahagian yang perlu dibetulkan.',
    ctaPrimary: 'Analisis bacaan saya',
    ctaSecondary: 'Mula dengan Qaidah Noorani',
    breadcrumbHome: 'Laman Utama',
    readMore: 'Baca pelajaran',
    languageLabel: 'Bahasa',
    sections: [
      {
        id: 'noun-sakina',
        title: 'Nun sakinah dan tanwin — idgham, izhar, iqlab, ikhfa',
        intro:
          'Empat hukum mengawal nun tanpa baris dan tanwin bergantung pada huruf yang mengikutinya. Ia membentuk kelancaran bacaan dan sentiasa diuji semasa ijazah.',
        items: [
          { arabic: 'إظهار', name: 'Izhar — sebutan jelas', text: 'Di hadapan huruf halqi (ء هـ ع ح غ خ), nun disebut jelas tanpa dengung yang panjang.', example: 'مَنْ آمَنَ' },
          { arabic: 'إدغام', name: 'Idgham — peleburan', text: 'Di hadapan ي ن م و (dengan ghunnah) dan ل ر (tanpa ghunnah), nun melebur dengan huruf berikutnya.', example: 'مَن يَقُولُ' },
          { arabic: 'إقلاب', name: 'Iqlab — penukaran', text: 'Di hadapan ba, nun bertukar menjadi mim yang didengungkan selama 2 harakat.', example: 'مِنۢ بَعْدِ' },
          { arabic: 'إخفاء', name: 'Ikhfa — penyamaran', text: 'Di hadapan 15 huruf yang selebihnya, nun disamarkan dengan ghunnah selama 2 harakat.', example: 'مِن قَبْلُ' },
        ],
      },
      {
        id: 'waqf',
        title: 'Waqaf — seni berhenti',
        intro:
          'Waqaf (الوقف) menentukan di mana boleh berhenti tanpa mengubah maksud. Tanda-tanda waqaf dalam mushaf membimbing pernafasan pembaca.',
        items: [
          { arabic: 'مـ', name: 'Waqaf lazim', text: 'Berhenti wajib: meneruskan bacaan akan mengubah maksud ayat.', example: 'إِنَّمَا يَسْتَجِيبُ الَّذِينَ يَسْمَعُونَ ۘ' },
          { arabic: 'ﻻ', name: 'Waqaf mamnu‘', text: 'Jangan berhenti di sini; jika nafas tidak cukup, ulang beberapa perkataan sebelumnya.', example: 'tanda ﻻ di atas teks' },
          { arabic: 'ج', name: 'Waqaf ja’iz', text: 'Berhenti pilihan: berhenti atau terus adalah setara.', example: 'tanda ج di atas teks' },
        ],
      },
    ],
    faq: [
      { q: 'Apakah itu tajwid?', a: 'Tajwid ialah ilmu yang menetapkan sebutan al-Quran yang betul: makhraj huruf, sifat huruf, mad, serta hukum sambungan dan waqaf.' },
      { q: 'Apakah hukum tajwid yang paling penting untuk pemula?', a: 'Mulakan dengan makhraj huruf yang hampir sama (ص/س, ط/ت, ع/ء), mad tabi‘i 2 harakat, qalqalah, dan empat hukum nun sakinah: izhar, idgham, iqlab dan ikhfa.' },
      { q: 'Berapa lama masa yang diperlukan untuk menguasai tajwid?', a: 'Dengan bacaan yang dibetulkan selama 15 hingga 20 minit sehari, hukum-hukum asas biasanya dikuasai dalam masa 3 hingga 6 bulan. Penguasaan penuh yang disahkan dengan ijazah biasanya memerlukan beberapa tahun bersama seorang guru.' },
      { q: 'Bolehkah belajar tajwid secara dalam talian dengan AI?', a: 'Boleh: AI dapat menranskripsikan bacaan anda, mengesan kesilapan makharij, mad dan ghunnah ayat demi ayat, dan meminta anda mengulang bahagian yang salah. Ia tidak menggantikan pengesahan oleh seorang syeikh, tetapi amat mempercepatkan latihan harian.' },
    ],
  },
  topics: {
    makharij: {
      title: 'Makharij — titik keluar huruf',
      h1: 'Makharij al-huruf: 17 titik keluar huruf Arab',
      metaTitle: 'Makharij al-huruf: 17 titik keluar huruf dijelaskan',
      metaDescription:
        'Pelajari makharij al-Quran: 5 kawasan dan 17 titik keluar huruf Arab, lengkap dengan contoh al-Quran dan kesilapan sebutan yang lazim.',
      intro:
        'Makharij (مخارج الحروف) ialah titik-titik keluarnya huruf Arab: 17 titik yang terbahagi kepada 5 kawasan — rongga mulut (al-jawf), kerongkong (al-halq), lidah (al-lisan), bibir (asy-syafatan) dan rongga hidung (al-khaisyum). Menyebut huruf pada titik yang salah akan mengubah perkataan, lalu mengubah maksud ayat: inilah ilmu pertama yang perlu dikuasai sebelum bab tajwid yang lain.',
      summary:
        '5 kawasan makhraj, huruf-huruf yang keluar darinya, dan cara menguji sesuatu makhraj: letakkan huruf itu dalam keadaan sukun didahului hamzah (أَقْ, أَعْ) dan dengar di mana bunyi itu berhenti.',
      items: [
        { arabic: 'الجوف', name: 'Al-jawf — rongga mulut', text: 'Tiga huruf mad (ا و ي) keluar dari ruang kosong mulut: tiada anggota yang menyekatnya, bunyi mengalir bebas.', example: 'نُوحِيهَا — wau dan ya mengalir tanpa putus.' },
        { arabic: 'ء هـ ع ح غ خ', name: 'Al-halq — kerongkong', text: 'Tiga peringkat: pangkal kerongkong (ء هـ), tengah (ع ح), hujung (غ خ). Jangan sekali-kali menekan bunyi dari dada.', example: 'الْعَالَمِينَ — ‘ain tidak boleh menjadi hamzah.' },
        { arabic: 'ق ك ج ش ض ل ن ر ط د ت ص ز س ظ ذ ث', name: 'Al-lisan — lidah', text: 'Sepuluh makhraj yang dihasilkan oleh lidah, dari pangkal (qaf, kaf) hingga ke gigi hadapan (tha, dzal, dza). Ini kawasan yang paling banyak makhraj dan paling banyak kesilapan.', example: 'الصِّرَاطَ — sad tebal, jangan dikelirukan dengan sin.' },
        { arabic: 'ف ب م و', name: 'Asy-syafatan — bibir', text: 'Fa keluar daripada bibir bawah bertemu gigi hadapan atas; ba dan mim daripada penutupan penuh; wau daripada bulatan bibir tanpa penutupan.', example: 'مَالِكِ — mim ditutup rapat sebelum dibuka.' },
        { arabic: 'الخيشوم', name: 'Al-khaisyum — rongga hidung', text: 'Tempat keluarnya ghunnah: dengungan dua kadar yang mengiringi nun dan mim yang diidghamkan atau disamarkan.', example: 'إِنَّ — ghunnah 2 harakat pada nun bertasydid.' },
      ],
      faq: [
        { q: 'Berapa banyakkah makharij dalam tajwid?', a: 'Mengikut mazhab yang paling masyhur (mazhab Ibn al-Jazari), terdapat 17 titik keluar huruf yang terbahagi kepada 5 kawasan: jawf, halq, lisan, syafatan dan khaisyum.' },
        { q: 'Bagaimana saya boleh memastikan sebutan huruf saya betul mengikut makhrajnya?', a: 'Letakkan huruf itu dalam keadaan sukun didahului hamzah berbaris (أَقْ, أَصْ, أَعْ) dan dengar dengan teliti di mana bunyi itu berhenti: itulah makhraj huruf tersebut.' },
        { q: 'Apakah kesilapan makharij yang paling kerap berlaku?', a: 'Mengelirukan ص dan س, ط dan ت, ض dan د, ذ dan ز, menyebut ع seperti hamzah, dan menelan ه di akhir perkataan. Kesilapan ini mengubah maksud perkataan dan dianggap sebagai kesalahan besar (lahn jali).' },
      ],
    },
    sifat: {
      title: 'Sifat — sifat-sifat huruf',
      h1: 'Sifat al-huruf: sifat-sifat huruf dalam tajwid',
      metaTitle: 'Sifat al-huruf: qalqalah, hams, tafkhim dan syiddah',
      metaDescription:
        'Fahami sifat huruf dalam tajwid: hams dan jahr, syiddah dan rakhawah, qalqalah, tafkhim dan tarqiq, lengkap dengan contoh al-Quran dan latihan pembetulan.',
      intro:
        'Sifat (صفات الحروف) menerangkan bagaimana sesuatu huruf keluar dari makhrajnya: bersuara atau berbisik, tegas atau lembut, tebal atau nipis, dengan atau tanpa pantulan. Dua huruf boleh berkongsi makhraj yang sama dan hanya dibezakan oleh sifatnya — itulah yang membezakan ت daripada ط, atau س daripada ص.',
      summary:
        'Sifat terbahagi kepada sifat berlawanan (hams/jahr, syiddah/rakhawah, isti‘la’/istifal, itbaq/infitah) dan sifat yang tiada lawan (qalqalah, safir, tafasysyi, ghunnah).',
      items: [
        { arabic: 'همس / جهر', name: 'Hams dan jahr — nafas dan suara', text: 'Sepuluh huruf hams (فحثه شخص سكت) membiarkan nafas mengalir; selebihnya adalah jahr, nafas ditahan.', example: 'سَلَامٌ — sin kekal berdesah hingga ke akhir.' },
        { arabic: 'شدة / رخاوة', name: 'Syiddah dan rakhawah — ketegasan dan kelembutan', text: 'Syiddah: bunyi berhenti serta-merta (أجد قط بكت). Rakhawah: bunyi boleh diteruskan. Mengelirukan kedua-duanya memanjangkan atau memotong perkataan secara silap.', example: 'الْحَقُّ — qaf tegas, jangan dipanjangkan.' },
        { arabic: 'قلقلة', name: 'Qalqalah — pantulan', text: 'Lima huruf qutbu jad (ق ط ب ج د) memantul sedikit apabila sukun, tanpa menambah sebarang baris.', example: 'قُلْ هُوَ اللَّهُ أَحَدْ — pantulan tegas pada dal akhir.' },
        { arabic: 'تفخيم / ترقيق', name: 'Tafkhim dan tarqiq — tebal dan nipis', text: 'Tujuh huruf isti‘la’ (خص ضغط قظ) sentiasa tebal; ra, lam pada lafaz Allah dan alif berubah mengikut baris sebelumnya.', example: 'بِسْمِ اللَّهِ — lam dinipiskan selepas kasrah.' },
        { arabic: 'صفير / تفشي', name: 'Safir dan tafasysyi — siulan dan sebaran', text: 'Sad, sin dan zai menghasilkan siulan tajam; syin menyebarkan udara ke seluruh mulut.', example: 'يَشْرَبُ — syin tersebar, bukan bersiul.' },
      ],
      faq: [
        { q: 'Apakah huruf-huruf qalqalah?', a: 'Iaitu lima huruf yang terhimpun dalam kalimah قطب جد: qaf, ta, ba, jim dan dal. Ia memantul apabila membawa sukun, terutamanya di penghujung ayat.' },
        { q: 'Bilakah ra dibaca tebal atau nipis?', a: 'Ra dibaca tebal (tafkhim) selepas fathah atau dammah, dan nipis (tarqiq) selepas kasrah atau ya sukun. Ketika waqaf, lihat baris sebelumnya.' },
        { q: 'Apa gunanya sifat sekiranya saya sudah tahu makharij?', a: 'Makhraj menunjukkan dari mana huruf itu keluar, sifat pula menunjukkan bagaimana bunyinya. Tanpa sifat, ت dan ط keluar dari tempat yang hampir sama dan menjadi sukar dibezakan.' },
      ],
    },
    madd: {
      title: 'Mad — pemanjangan',
      h1: 'Mad dalam tajwid: kadar, jenis dan kesilapan lazim',
      metaTitle: 'Mad dalam tajwid: kadar (2, 4, 6 harakat) dan jenisnya',
      metaDescription:
        'Semua hukum mad: mad tabi‘i, muttasil, munfasil, lazim dan ‘arid, kadar harakatnya, serta kesilapan pemanjangan yang paling kerap berlaku.',
      intro:
        'Mad (المد) ialah pemanjangan huruf mad (ا و ي) apabila diikuti oleh hamzah atau sukun. Kadarnya dikira dalam harakat, iaitu satuan masa bagi satu baris pendek. Memanjangkan terlalu pendek atau terlalu panjang ialah kesilapan paling lazim dalam kalangan pembaca pemula, dan yang pertama dibetulkan oleh seorang guru.',
      summary:
        'Mad tabi‘i berkadar 2 harakat; mad terbitan berkadar 4, 5 atau 6 harakat bergantung pada sebabnya (hamzah atau sukun) dan riwayat bacaan yang dipilih. Kaedah emasnya: kekalkan kadar yang sama dari awal hingga akhir bacaan.',
      items: [
        { arabic: '٢', name: 'Mad tabi‘i — asli', text: '2 harakat, tanpa hamzah atau sukun selepas huruf mad. Inilah asas kepada setiap bacaan.', example: 'قَالَ — dua kadar pada alif.' },
        { arabic: '٤ / ٥', name: 'Mad muttasil — bersambung', text: 'Hamzah mengikuti huruf mad dalam perkataan yang sama: 4 hingga 5 harakat, wajib dalam semua riwayat.', example: 'السَّمَاءِ — pemanjangan wajib sebelum hamzah.' },
        { arabic: '٢ / ٤ / ٥', name: 'Mad munfasil — berasingan', text: 'Hamzah membuka perkataan seterusnya. Kadarnya bergantung pada riwayat; dalam riwayat Hafs ‘an ‘Asim, 4 atau 5 harakat.', example: 'بِمَا أُنْزِلَ — kekalkan kadar yang sama sepanjang surah.' },
        { arabic: '٦', name: 'Mad lazim — wajib', text: '6 harakat apabila sukun tetap mengikuti huruf mad, terutamanya pada huruf-huruf muqatta‘ah di awal surah.', example: 'الٓمٓ — enam kadar pada mim.' },
        { arabic: '٢ / ٤ / ٦', name: 'Mad ‘arid lissukun — sementara', text: 'Sukun timbul kerana berhenti di penghujung ayat: 2, 4 atau 6 harakat, mengikut pilihan, tetapi hendaklah konsisten.', example: 'الْعَالَمِينَ — semasa waqaf, ya dipanjangkan.' },
      ],
      faq: [
        { q: 'Berapa lamakah satu harakat?', a: 'Satu harakat ialah masa menyebut satu baris pendek, lebih kurang masa melipat satu jari. Yang penting bukan kadar mutlak tetapi konsistensi antara mad jenis yang sama.' },
        { q: 'Apakah beza antara mad muttasil dan munfasil?', a: 'Dalam mad muttasil, huruf mad dan hamzah berada dalam perkataan yang sama, dan pemanjangan itu wajib. Dalam mad munfasil, hamzah berada di awal perkataan seterusnya, dan kadarnya berbeza mengikut riwayat.' },
        { q: 'Bagaimana membetulkan mad yang terlalu pendek?', a: 'Kira harakat dengan kuat pada satu ayat pendek, rakamkan bacaan anda, kemudian bandingkan dengan seorang qari rujukan. Analisis automatik ke atas bacaan anda dapat mengesan mad yang terlalu pendek atau terlalu panjang, ayat demi ayat.' },
      ],
    },
  },
};

export const msExtra: {
  topics: Record<ExtraTopicSlug, TopicContent>;
  faqPage: FaqPageStrings;
  quizStrings: QuizStrings;
  linkBlock: LinkBlockStrings;
  quizzes: Record<string, QuizQuestion[]>;
} = {
  topics: {
    'waqf-ibtida': {
      title: 'Waqaf dan ibtida’ — berhenti dan menyambung semula',
      h1: 'Waqaf dan ibtida’: di mana berhenti dan di mana menyambung semula dalam al-Quran',
      metaTitle: 'Waqaf dan ibtida’ dalam tajwid: tanda waqaf dan hukumnya',
      metaDescription:
        'Panduan waqaf dan ibtida’: tanda waqaf mushaf (مـ, ﻻ, ج, صلى, قلى), waqaf tam, kafi, hasan dan qabih, serta hukum menyambung semula selepas waqaf.',
      intro:
        'Waqaf (الوقف) ialah seni berhenti, manakala ibtida’ (الابتداء) ialah seni menyambung semula bacaan. Berhenti di tempat yang salah boleh membalikkan maksud sesuatu ayat; menyambung semula di tempat yang tidak sesuai pula menjadikannya tidak difahami. Kedua-dua ilmu ini melengkapkan makharij, sifat dan mad: ia berkait dengan maksud sama seperti ia berkait dengan bunyi.',
      summary:
        'Empat jenis waqaf (tam, kafi, hasan, qabih), tanda-tanda dalam mushaf, dan hukum ibtida’: sambung semula pada perkataan yang membuka maksud yang lengkap.',
      items: [
        { arabic: 'الوقف التام', name: 'Waqaf tam — berhenti sempurna', text: 'Maksud dan tatabahasa sudah lengkap: berhenti dan sambung semula pada perkataan berikutnya tanpa perlu mengulang ke belakang.', example: 'وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ' },
        { arabic: 'الوقف الكافي', name: 'Waqaf kafi — berhenti mencukupi', text: 'Maksud sudah lengkap tetapi masih berkait dari sudut tatabahasa dengan ayat berikutnya; berhenti dibenarkan dan sambung semula pada perkataan berikutnya.', example: 'خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ' },
        { arabic: 'الوقف الحسن', name: 'Waqaf hasan — berhenti yang baik', text: 'Maksudnya dapat difahami tetapi bergantung kepada ayat berikutnya: boleh berhenti, tetapi lebih baik sambung semula beberapa perkataan sebelumnya.', example: 'الْحَمْدُ لِلَّهِ' },
        { arabic: 'الوقف القبيح', name: 'Waqaf qabih — berhenti tercela', text: 'Berhenti di situ mengherotkan maksud: ia dilarang kecuali kerana kehabisan nafas, dan hendaklah kemudian menyambung semula dari lebih awal.', example: 'فَوَيْلٌ لِّلْمُصَلِّينَ (tanpa ayat berikutnya)' },
        { arabic: 'الابتداء', name: 'Ibtida’ — menyambung semula', text: 'Jangan sekali-kali menyambung semula pada perkataan yang maksudnya bergantung kepada ayat sebelumnya: kembalilah ke permulaan unit maksud tersebut.', example: 'sambung semula pada الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ' },
        { arabic: 'صلى / قلى', name: 'Tanda-tanda mushaf', text: 'صلى: lebih baik diteruskan. قلى: lebih baik berhenti. ∴ … ∴: berhenti pada salah satu daripada dua titik sahaja.', example: 'tanda-tanda waqaf dalam mushaf Madinah' },
      ],
      faq: [
        { q: 'Apakah beza antara waqaf dan sakt?', a: 'Waqaf ialah berhenti dengan memotong bunyi sambil menarik nafas. Sakt pula ialah pemberhentian sebentar tanpa menarik nafas, ditandai dengan huruf س dalam mushaf, seperti pada عِوَجَا ۜ قَيِّمًا.' },
        { q: 'Bolehkah saya berhenti di mana-mana sahaja jika kehabisan nafas?', a: 'Ya, berhenti secara terpaksa (waqaf idtirari) dibenarkan di mana-mana sahaja. Namun sambungan semula hendaklah dilakukan beberapa perkataan sebelumnya, pada permulaan maksud yang lengkap, supaya mesej ayat tidak terjejas.' },
        { q: 'Apakah maksud tanda ﻻ dalam mushaf?', a: 'Tanda ini menunjukkan supaya tidak berhenti di tempat itu, kerana berhenti di situ akan merosakkan maksud. Jika tetap kehabisan nafas, ulang bacaan beberapa perkataan sebelumnya.' },
        { q: 'Adakah waqaf diuji semasa ijazah?', a: 'Ya. Seorang syeikh menilai bukan sahaja sebutan tetapi juga ketepatan tempat berhenti dan menyambung semula, kerana kedua-duanya menunjukkan kefahaman pembaca terhadap teks.' },
      ],
    },
    qalqalah: {
      title: 'Qalqalah — pantulan',
      h1: 'Qalqalah dalam tajwid: huruf, tahap dan contoh al-Quran',
      metaTitle: 'Qalqalah: 5 huruf qutbu jad, tahap dan contohnya',
      metaDescription:
        'Segala tentang qalqalah: lima huruf qutbu jad (ق ط ب ج د), qalqalah sughra dan kubra, kesilapan yang lazim dan contoh daripada al-Quran.',
      intro:
        'Qalqalah (القلقلة) ialah pantulan halus bunyi yang mengiringi lima huruf apabila membawa sukun. Ia memberikan kejelasan irama kepada bacaan: tanpanya huruf itu akan terbantut; jika dilebih-lebihkan, ia menambah baris yang tidak wujud dalam teks.',
      summary:
        'Lima huruf قطب جد, perbezaan antara qalqalah sughra (di tengah perkataan) dan kubra (ketika waqaf), serta kaedah emasnya: pantulan tegas, tanpa penambahan baris.',
      items: [
        { arabic: 'قطب جد', name: 'Lima huruf', text: 'Qaf, ta, ba, jim dan dal: terhimpun dalam kalimah mudah ingat قطب جد, hanya huruf-huruf inilah yang memantul.', example: 'أَبْصَارِهِمْ — pantulan pada ba sukun.' },
        { arabic: 'الصغرى', name: 'Qalqalah sughra — kecil', text: 'Huruf membawa sukun di tengah perkataan: pantulannya ringan dan pantas, tanpa memanjangkan suku kata.', example: 'يَجْعَلُونَ — pantulan halus pada jim.' },
        { arabic: 'الكبرى', name: 'Qalqalah kubra — besar', text: 'Huruf berada di akhir perkataan dan bacaan berhenti padanya: pantulannya lebih ketara, tanpa menambah sebarang baris.', example: 'قُلْ هُوَ اللَّهُ أَحَدْ' },
        { arabic: 'المشددة', name: 'Qalqalah pada huruf bertasydid', text: 'Ketika berhenti pada huruf qalqalah yang bertasydid, tahan dahulu tasydidnya kemudian pantulkan sekali sahaja.', example: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ' },
        { arabic: 'الأخطاء', name: 'Kesilapan lazim', text: 'Menambah fathah atau dammah pada pantulan, tertinggal qalqalah di tengah perkataan, atau memantulkan huruf yang tidak berqalqalah (ت, ك).', example: 'يَقْطَعُونَ — jangan sebut “yaqata‘un”.' },
      ],
      faq: [
        { q: 'Apakah huruf-huruf qalqalah?', a: 'Lima huruf yang terhimpun dalam kalimah قطب جد: qaf, ta, ba, jim dan dal. Ia memantul setiap kali membawa sukun, sama ada di tengah perkataan mahupun ketika waqaf.' },
        { q: 'Apakah beza antara qalqalah sughra dan kubra?', a: 'Qalqalah sughra berlaku di tengah perkataan dengan sukun asli: pantulannya ringan. Qalqalah kubra pula berlaku di akhir perkataan ketika berhenti padanya: pantulannya lebih jelas.' },
        { q: 'Adakah qalqalah menambah baris?', a: 'Tidak. Pantulan itu tidak boleh sekali-kali bertukar menjadi fathah, kasrah atau dammah. Ia hanyalah gema huruf semata-mata, tanpa sebarang baris yang boleh dikenal pasti.' },
        { q: 'Bagaimana cara berlatih qalqalah?', a: 'Bacakan surah al-Ikhlas dan al-Masad sambil menandakan setiap sukun huruf قطب جد, rakamkan bacaan anda, kemudian bandingkan dengan seorang qari rujukan. Analisis automatik ayat demi ayat dapat mengesan pantulan yang tertinggal atau dilebih-lebihkan.' },
      ],
    },
  },
  faqPage: {
    metaTitle: 'Soalan Lazim Tajwid: rujukan lengkap dwibahasa',
    metaDescription:
      'Soalan lazim tajwid: makharij, sifat, mad, qalqalah, waqaf dan ibtida’. Jawapan ringkas dan tepat untuk membantu anda memperbaiki bacaan al-Quran.',
    h1: 'Soalan lazim tajwid',
    intro:
      'Halaman ini menghimpunkan soalan-soalan yang paling kerap ditanya tentang tajwid, disusun mengikut pelajaran: makhraj huruf, sifat huruf, mad, qalqalah, serta waqaf dan ibtida’. Setiap bahagian dipautkan kepada pelajaran terperinci yang berkaitan.',
    linkLabel: 'Semua soalan lazim',
    sectionAll: 'Soalan umum',
    backToHub: 'Kembali ke panduan tajwid',
  },
  quizStrings: {
    heading: 'Kuiz: uji pengetahuan anda',
    intro: 'Lima soalan aneka pilihan dengan pembetulan segera.',
    check: 'Semak',
    next: 'Soalan seterusnya',
    restart: 'Mula semula',
    correct: 'Jawapan betul',
    wrong: 'Jawapan salah',
    result: 'Skor anda',
    best: 'Skor terbaik',
    progress: 'Soalan',
  },
  linkBlock: {
    heading: 'Teruskan dengan pelajaran tajwid',
    intro: 'Setiap pelajaran menghuraikan satu hukum lengkap dengan contoh al-Quran, kesilapan lazim dan kuiz.',
  },
  quizzes: {
    makharij: [
      { q: 'Berapakah bilangan titik keluar huruf (makharij)?', options: ['5', '17', '28'], answer: 1, explanation: '17 makharij dalam 5 kawasan, menurut Ibn al-Jazari.' },
      { q: 'Dari kawasan manakah keluarnya huruf mad ا و ي?', options: ['Al-jawf', 'Al-halq', 'Asy-syafatan'], answer: 0, explanation: 'Ia keluar dari ruang kosong mulut, iaitu al-jawf.' },
      { q: 'Huruf manakah yang keluar dari bibir bawah bertemu gigi hadapan atas?', options: ['Ba', 'Fa', 'Mim'], answer: 1, explanation: 'Fa: bibir bawah bertemu gigi hadapan atas.' },
      { q: 'Di manakah keluarnya ghunnah?', options: ['Al-khaisyum', 'Al-lisan', 'Al-halq'], answer: 0, explanation: 'Ghunnah keluar dari rongga hidung, al-khaisyum.' },
      { q: 'Kesilapan makhraj manakah yang tergolong lahn jali?', options: ['Menyebut ع seperti hamzah', 'Memanjangkan mad 5 harakat berbanding 4', 'Tertinggal qalqalah'], answer: 0, explanation: 'Mengubah makhraj mengubah perkataan: ini kesalahan besar.' },
    ],
    sifat: [
      { q: 'Huruf-huruf manakah yang membawa qalqalah?', options: ['فحثه شخص سكت', 'قطب جد', 'خص ضغط قظ'], answer: 1, explanation: 'قطب جد menghimpunkan lima huruf qalqalah.' },
      { q: 'Apakah maksud hams?', options: ['Nafas mengalir', 'Bunyi terhenti', 'Huruf itu tebal'], answer: 0, explanation: 'Hams: nafas terus mengalir bersama huruf.' },
      { q: 'Ra selepas kasrah dibaca…', options: ['Sentiasa tebal', 'Nipis (tarqiq)', 'Berdengung'], answer: 1, explanation: 'Selepas kasrah, ra dibaca nipis.' },
      { q: 'Sifat manakah yang tiada lawan?', options: ['Syiddah', 'Jahr', 'Safir'], answer: 2, explanation: 'Safir tergolong dalam sifat yang tiada lawan.' },
      { q: 'Mengapakah ت dan ط berbeza?', options: ['Kerana sifatnya', 'Kerana makhrajnya', 'Kerana madnya'], answer: 0, explanation: 'Makhrajnya hampir sama; sifatlah yang membezakannya.' },
    ],
    madd: [
      { q: 'Berapa harakatkah kadar mad tabi‘i?', options: ['2', '4', '6'], answer: 0, explanation: 'Mad tabi‘i berkadar 2 harakat.' },
      { q: 'Mad lazim berkadar…', options: ['2 harakat', '4 harakat', '6 harakat'], answer: 2, explanation: '6 harakat, sukun tetap selepas huruf mad.' },
      { q: 'Dalam mad muttasil, hamzah berada…', options: ['Dalam perkataan yang sama', 'Di awal perkataan berikutnya', 'Tiada'], answer: 0, explanation: 'Muttasil = bersambung: hamzah dalam perkataan sama, pemanjangan wajib.' },
      { q: 'الٓمٓ merupakan contoh mad manakah?', options: ['Munfasil', 'Lazim', 'ʿArid'], answer: 1, explanation: 'Huruf muqatta‘ah di awal surah tergolong mad lazim.' },
      { q: 'Mad ‘arid lissukun timbul…', options: ['Ketika berhenti di penghujung ayat', 'Sebelum setiap hamzah', 'Hanya dalam riwayat Warsy'], answer: 0, explanation: 'Sukun itu sementara, disebabkan oleh pemberhentian.' },
    ],
    'waqf-ibtida': [
      { q: 'Waqaf tam bermaksud…', options: ['Maksudnya telah lengkap', 'Berhenti dilarang', 'Perlu diulang ke belakang'], answer: 0, explanation: 'Maksud dan tatabahasa lengkap: waqaf yang ideal.' },
      { q: 'Tanda ﻻ menunjukkan…', options: ['Berhenti wajib', 'Jangan berhenti', 'Berhenti lebih afdal'], answer: 1, explanation: 'ﻻ menandakan waqaf mamnu‘.' },
      { q: 'Selepas berhenti terpaksa, bacaan disambung…', options: ['Pada perkataan seterusnya', 'Beberapa perkataan sebelumnya', 'Dari awal surah'], answer: 1, explanation: 'Sambung semula pada permulaan maksud yang lengkap.' },
      { q: 'Sakt ialah…', options: ['Berhenti sambil menarik nafas', 'Pemberhentian tanpa menarik nafas', 'Pemanjangan 6 harakat'], answer: 1, explanation: 'Sakt memotong suara, bukan nafas.' },
      { q: 'Waqaf qabih adalah…', options: ['Digalakkan', 'Tercela kerana mengherotkan maksud', 'Neutral'], answer: 1, explanation: 'Berhenti di situ mengubah maksud ayat.' },
    ],
    qalqalah: [
      { q: 'Berapakah bilangan huruf yang membawa qalqalah?', options: ['3', '5', '7'], answer: 1, explanation: 'Lima huruf: ق ط ب ج د.' },
      { q: 'Qalqalah kubra berlaku…', options: ['Di tengah perkataan', 'Ketika berhenti di akhir perkataan', 'Sebelum hamzah'], answer: 1, explanation: 'Qalqalah besar: ketika berhenti pada huruf akhir.' },
      { q: 'Adakah qalqalah menambah baris?', options: ['Ya, fathah', 'Tidak, sama sekali', 'Ya, dammah'], answer: 1, explanation: 'Ia hanyalah pantulan tegas tanpa sebarang baris.' },
      { q: 'Huruf manakah yang tiada qalqalah?', options: ['Kaf', 'Jim', 'Dal'], answer: 0, explanation: 'Kaf tidak tergolong dalam قطب جد.' },
      { q: 'Ketika berhenti pada تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ, anda…', options: ['Memantul sekali selepas tasydid', 'Memantul dua kali', 'Tidak memantul'], answer: 0, explanation: 'Tahan tasydid dahulu, kemudian pantul sekali sahaja.' },
    ],
  },
};
