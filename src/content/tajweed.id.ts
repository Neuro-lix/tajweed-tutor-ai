// Terjemahan bahasa Indonesia untuk konten tajwid (hub + tiga topik utama).
// Hanya menggunakan type-only import agar tidak terjadi runtime import cycle.
import type { HubContent, PillarSlug, TopicContent } from './tajweed';

export const idDict: { hub: HubContent; topics: Record<PillarSlug, TopicContent> } = {
  hub: {
    metaTitle: 'Hukum tajwid: makhraj, sifat, dan mad dijelaskan',
    metaDescription:
      'Panduan lengkap hukum tajwid: makharijul huruf, sifatul huruf, mad, nun sakinah, dan waqaf, disertai contoh dari Al-Qur\u2019an.',
    h1: 'Hukum tajwid: makhraj, sifat, dan mad',
    intro:
      'Belajar tajwid berarti memberikan hak setiap huruf Al-Qur\u2019an. Panduan ini merangkum hukum-hukum penting \u2014 makharijul huruf, sifatul huruf, mad, nun sakinah, dan tanda waqaf \u2014 lengkap dengan contoh dari mushaf, agar bacaanmu semakin sesuai kaidah dalam sepuluh qiraat.',
    topicsHeading: 'Tiga pilar utama tajwid',
    topicsIntro:
      'Setiap pilar memiliki pelajaran lengkap berisi kaidah, contoh dari Al-Qur\u2019an, dan kesalahan yang sering terjadi.',
    moreHeading: 'Hukum sambung dan berhenti (waqaf)',
    faqHeading: 'Pertanyaan yang sering diajukan',
    ctaTitle: 'Praktikkan hukum-hukum ini hari ini juga',
    ctaText:
      'Bacalah satu ayat, AI akan mentranskripsi bacaanmu, mendeteksi kesalahan makhraj, mad, dan ghunnah, lalu memintamu mengulang tepat pada bagian yang perlu diperbaiki.',
    ctaPrimary: 'Analisis bacaanku',
    ctaSecondary: 'Mulai dengan Qaidah Nuraniyah',
    breadcrumbHome: 'Beranda',
    readMore: 'Baca pelajaran',
    languageLabel: 'Bahasa',
    sections: [
      {
        id: 'noun-sakina',
        title: 'Nun sakinah dan tanwin \u2014 idgham, izhar, iqlab, ikhfa',
        intro:
          'Empat hukum mengatur nun sakinah dan tanwin tergantung huruf yang mengikutinya. Hukum-hukum ini membentuk kelancaran bacaan dan selalu diuji dalam ijazah.',
        items: [
          { arabic: '\u0625\u0638\u0647\u0627\u0631', name: 'Izhar \u2014 pengucapan jelas', text: 'Di depan huruf tenggorokan (\u0621 \u0647ـ \u0639 \u062d \u063a \u062e), nun diucapkan jelas tanpa dengung yang dipanjangkan.', example: '\u0645\u064e\u0646\u0652 \u0622\u0645\u064e\u0646\u064e' },
          { arabic: '\u0625\u062f\u063a\u0627\u0645', name: 'Idgham \u2014 peleburan', text: 'Di depan \u064a \u0646 \u0645 \u0648 (dengan ghunnah) dan \u0644 \u0631 (tanpa ghunnah), nun melebur ke huruf berikutnya.', example: '\u0645\u064e\u0646 \u064a\u064e\u0642\u0648\u0644\u064f' },
          { arabic: '\u0625\u0642\u0644\u0627\u0628', name: 'Iqlab \u2014 penggantian', text: 'Di depan huruf ba, nun berubah menjadi mim yang didengungkan selama 2 harakat.', example: '\u0645\u0650\u0646\u06e2 \u0628\u064e\u0639\u0652\u062f\u0650' },
          { arabic: '\u0625\u062e\u0641\u0627\u0621', name: 'Ikhfa \u2014 penyamaran', text: 'Di depan 15 huruf sisanya, nun disamarkan dengan ghunnah selama 2 harakat.', example: '\u0645\u0650\u0646 \u0642\u064e\u0628\u0652\u0644\u064f' },
        ],
      },
      {
        id: 'waqf',
        title: 'Waqaf \u2014 seni berhenti dalam bacaan',
        intro:
          'Waqaf (\u0627\u0644\u0648\u0642\u0641) menentukan di mana boleh berhenti tanpa mengubah makna. Tanda-tanda waqaf dalam mushaf membantu pengaturan napas pembaca.',
        items: [
          { arabic: '\u0645ـ', name: 'Waqaf lazim', text: 'Berhenti wajib: melanjutkan bacaan akan mengubah makna ayat.', example: '\u0625\u0650\u0646\u0651\u064e\u0645\u064e\u0627 \u064a\u064e\u0633\u0652\u062a\u064e\u062c\u0650\u064a\u0628\u064f \u0627\u0644\u0651\u064e\u0630\u0650\u064a\u0646\u064e \u064a\u064e\u0633\u0652\u0645\u064e\u0639\u0648\u0646\u064e \u06d8' },
          { arabic: '\ufefb', name: 'Waqaf mamnu\u2018', text: 'Jangan berhenti di sini; jika napas habis, ulangi beberapa kata sebelumnya.', example: 'tanda \ufefb di atas teks' },
          { arabic: '\u062c', name: 'Waqaf ja\u2019iz', text: 'Berhenti diperbolehkan: berhenti atau melanjutkan sama-sama sah.', example: 'tanda \u062c di atas teks' },
        ],
      },
    ],
    faq: [
      { q: 'Apa itu tajwid?', a: 'Tajwid adalah ilmu yang mengatur cara membaca Al-Qur\u2019an dengan benar: makharijul huruf, sifatul huruf, mad, serta hukum sambung dan berhenti (waqaf).' },
      { q: 'Hukum tajwid apa yang paling penting bagi pemula?', a: 'Mulailah dengan makhraj huruf-huruf yang mirip (\u0635/\u0633, \u0637/\u062a, \u0639/\u0621), mad thabi\u2018i 2 harakat, qalqalah, dan empat hukum nun sakinah: izhar, idgham, iqlab, dan ikhfa.' },
      { q: 'Berapa lama waktu untuk menguasai tajwid?', a: 'Dengan 15\u201320 menit bacaan yang dikoreksi setiap hari, kaidah dasar biasanya dikuasai dalam 3\u20136 bulan. Penguasaan penuh yang dibuktikan dengan ijazah umumnya membutuhkan bertahun-tahun bersama seorang guru.' },
      { q: 'Bisakah belajar tajwid secara daring dengan bantuan AI?', a: 'Bisa. AI dapat mentranskripsi bacaanmu, mendeteksi kesalahan makhraj, mad, dan ghunnah ayat demi ayat, lalu memintamu mengulang bagian yang keliru. AI tidak menggantikan sanad dan ijazah dari seorang guru, tetapi sangat mempercepat latihan harian.' },
    ],
  },
  topics: {
    makharij: {
      title: 'Makhraj \u2014 tempat keluarnya huruf',
      h1: 'Makharijul huruf: 17 tempat keluarnya huruf hijaiyah',
      metaTitle: 'Makharijul huruf: 17 tempat keluar huruf dijelaskan',
      metaDescription:
        'Pelajari makharijul huruf Al-Qur\u2019an: 5 area dan 17 titik keluarnya huruf hijaiyah, lengkap contoh dari Al-Qur\u2019an dan kesalahan pelafalan yang umum.',
      intro:
        'Makhraj (\u0645\u062e\u0627\u0631\u062c \u0627\u0644\u062d\u0631\u0648\u0641) adalah tempat keluarnya huruf hijaiyah: 17 titik yang tersebar di 5 area \u2014 rongga mulut (al-jauf), tenggorokan (al-halq), lidah (al-lisan), bibir (asy-syafatan), dan rongga hidung (al-khaisyum). Mengucapkan huruf dari makhraj yang salah akan mengubah kata, sehingga mengubah makna ayat: inilah ilmu pertama yang harus dipelajari sebelum bab tajwid lainnya.',
      summary:
        'Lima area makhraj, huruf-huruf yang keluar darinya, serta cara menguji sebuah makhraj: berikan sukun pada huruf yang didahului hamzah (\u0623\u064e\u0642\u0652, \u0623\u064e\u0639\u0652) lalu dengarkan di mana suara itu berhenti.',
      items: [
        { arabic: '\u0627\u0644\u062c\u0648\u0641', name: 'Al-jauf \u2014 rongga mulut', text: 'Tiga huruf mad (\u0627 \u0648 \u064a) keluar dari rongga kosong mulut: tidak ada organ yang menghalanginya, suara mengalir bebas.', example: '\u0646\u0648\u062d\u064a\u0647\u0627 \u2014 wau dan ya mengalir tanpa terputus.' },
        { arabic: '\u0621 \u0647ـ \u0639 \u062d \u063a \u062e', name: 'Al-halq \u2014 tenggorokan', text: 'Tiga tingkat: pangkal tenggorokan (\u0621 \u0647ـ), tengah (\u0639 \u062d), atas (\u063a \u062e). Jangan pernah memaksakan suara dari dada.', example: '\u0627\u0644\u0652\u0639\u064e\u0627\u0644\u064e\u0645\u064a\u0646\u064e \u2014 huruf ain tidak boleh berubah menjadi hamzah.' },
        { arabic: '\u0642 \u0643 \u062c \u0634 \u0636 \u0644 \u0646 \u0631 \u0637 \u062f \u062a \u0635 \u0632 \u0633 \u0638 \u0630 \u062b', name: 'Al-lisan \u2014 lidah', text: 'Sepuluh makhraj dihasilkan oleh lidah, dari pangkal (qaf, kaf) hingga gigi seri (tsa, dzal, zha). Ini adalah area paling banyak dan paling sering menimbulkan kesalahan.', example: '\u0627\u0644\u0635\u0651\u0650\u0631\u064e\u0627\u0637\u064e \u2014 shad yang tebal, jangan tertukar dengan sin.' },
        { arabic: '\u0641 \u0628 \u0645 \u0648', name: 'Asy-syafatan \u2014 bibir', text: 'Huruf fa keluar dari bibir bawah bertemu gigi seri atas; ba dan mim dari penutupan penuh; wau dari bulatan bibir tanpa menutup rapat.', example: '\u0645\u064e\u0627\u0644\u0650\u0643\u0650 \u2014 mim tertutup rapat sebelum terbuka.' },
        { arabic: '\u0627\u0644\u062e\u064a\u0634\u0648\u0645', name: 'Al-khaisyum \u2014 rongga hidung', text: 'Tempat keluarnya ghunnah: dengungan dua ketukan yang menyertai nun dan mim saat diidghamkan atau diikhfakan.', example: '\u0625\u0650\u0646\u0651\u064e \u2014 ghunnah 2 harakat pada nun yang bertasydid.' },
      ],
      faq: [
        { q: 'Ada berapa makhraj dalam ilmu tajwid?', a: 'Menurut pendapat yang paling masyhur (mazhab Ibnul Jazari), terdapat 17 titik makhraj yang tersebar di 5 area: jauf, halq, lisan, syafatan, dan khaisyum.' },
        { q: 'Bagaimana cara memeriksa apakah pengucapan sebuah huruf sudah tepat pada makhrajnya?', a: 'Berikan sukun pada huruf tersebut yang didahului hamzah berharakat (\u0623\u064e\u0642\u0652, \u0623\u064e\u0635\u0652, \u0623\u064e\u0639\u0652), lalu dengarkan dengan tepat di mana suara itu berhenti: itulah makhraj huruf tersebut.' },
        { q: 'Apa saja kesalahan makhraj yang paling sering terjadi?', a: 'Mencampuradukkan \u0635 dan \u0633, \u0637 dan \u062a, \u0636 dan \u062f, \u0630 dan \u0632, mengucapkan \u0639 seperti hamzah, dan menelan huruf \u0647 di akhir kata. Kesalahan ini mengubah makna kata dan dianggap kesalahan besar (lahn jali).' },
      ],
    },
    sifat: {
      title: 'Sifat \u2014 karakter huruf',
      h1: 'Sifatul huruf: karakter huruf dalam ilmu tajwid',
      metaTitle: 'Sifatul huruf: qalqalah, hams, tafkhim, dan syiddah',
      metaDescription:
        'Pahami sifatul huruf dalam tajwid: hams dan jahr, syiddah dan rakhawah, qalqalah, tafkhim dan tarqiq, lengkap contoh Al-Qur\u2019an dan latihan koreksi.',
      intro:
        'Sifat (\u0635\u0641\u0627\u062a \u0627\u0644\u062d\u0631\u0648\u0641) menggambarkan cara sebuah huruf keluar dari makhrajnya: bersuara atau berdesis, tegas atau mengalir, tebal atau tipis, dengan atau tanpa pantulan. Dua huruf bisa memiliki makhraj yang sama dan hanya dibedakan oleh sifatnya \u2014 itulah yang membedakan \u062a dari \u0637, atau \u0633 dari \u0635.',
      summary:
        'Sifat terbagi menjadi sifat yang berlawanan (hams/jahr, syiddah/rakhawah, isti\u2018la/istifal, ithbaq/infitah) dan sifat yang tidak berlawanan (qalqalah, shafir, tafasysyi, ghunnah).',
      items: [
        { arabic: '\u0647\u0645\u0633 / \u062c\u0647\u0631', name: 'Hams dan jahr \u2014 embusan napas dan suara', text: 'Sepuluh huruf hams (\u0641\u062d\u062b\u0647 \u0634\u062e\u0635 \u0633\u0643\u062a) membiarkan napas mengalir; huruf lainnya adalah jahr, napas tertahan.', example: '\u0633\u064e\u0644\u064e\u0627\u0645\u064c \u2014 huruf sin tetap berdesis hingga akhir.' },
        { arabic: '\u0634\u062f\u0629 / \u0631\u062e\u0627\u0648\u0629', name: 'Syiddah dan rakhawah \u2014 ketegasan dan kelenturan', text: 'Syiddah: suara berhenti secara tegas (\u0623\u062c\u062f \u0642\u0637 \u0628\u0643\u062a). Rakhawah: suara dapat dipanjangkan. Mencampuradukkan keduanya membuat kata salah dipanjangkan atau dipotong.', example: '\u0627\u0644\u0652\u062d\u064e\u0642\u0651\u064f \u2014 huruf qaf tegas, tidak pernah dipanjangkan.' },
        { arabic: '\u0642\u0644\u0642\u0644\u0629', name: 'Qalqalah \u2014 pantulan suara', text: 'Lima huruf qathbu jad (\u0642 \u0637 \u0628 \u062c \u062f) memantul ringan saat sukun, tanpa menambahkan harakat apa pun.', example: '\u0642\u064f\u0644\u0652 \u0647\u064f\u0648\u064e \u0627\u0644\u0644\u0651\u0647\u064f \u0623\u064e\u062d\u064e\u062f\u0652 \u2014 pantulan tegas pada dal terakhir.' },
        { arabic: '\u062a\u0641\u062e\u064a\u0645 / \u062a\u0631\u0642\u064a\u0642', name: 'Tafkhim dan tarqiq \u2014 penebalan dan penipisan', text: 'Tujuh huruf isti\u2018la (\u062e\u0635 \u0636\u063a\u0637 \u0642\u0638) selalu tebal; huruf ra, lam pada lafal Allah, dan alif berubah sesuai harakat sebelumnya.', example: '\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u0647\u0650 \u2014 lam tipis setelah kasrah.' },
        { arabic: '\u0635\u0641\u064a\u0631 / \u062a\u0641\u0634\u064a', name: 'Shafir dan tafasysyi \u2014 desisan dan penyebaran', text: 'Huruf shad, sin, dan zay menghasilkan desisan tajam; huruf syin menyebarkan udara ke seluruh mulut.', example: '\u064a\u064e\u0634\u0652\u0631\u064e\u0628\u064f \u2014 huruf syin menyebar, bukan berdesis.' },
      ],
      faq: [
        { q: 'Apa saja huruf qalqalah?', a: 'Yaitu lima huruf yang terkumpul dalam kata \u0642\u0637\u0628 \u062c\u062f: qaf, tha, ba, jim, dan dal. Huruf-huruf ini memantul ketika bersukun, terutama di akhir ayat.' },
        { q: 'Kapan huruf ra dibaca tebal atau tipis?', a: 'Ra dibaca tebal (tafkhim) setelah fathah atau dhammah, dan tipis (tarqiq) setelah kasrah atau ya sukun. Saat waqaf, perhatikan harakat sebelumnya.' },
        { q: 'Untuk apa mempelajari sifat jika sudah tahu makhraj?', a: 'Makhraj menunjukkan asal keluarnya huruf, sedangkan sifat menunjukkan cara bunyinya. Tanpa sifat, huruf \u062a dan \u0637 keluar dari tempat yang hampir sama dan sulit dibedakan.' },
      ],
    },
    madd: {
      title: 'Mad \u2014 pemanjangan bacaan',
      h1: 'Mad dalam tajwid: durasi, jenis, dan kesalahan umum',
      metaTitle: 'Mad dalam tajwid: durasi (2, 4, 6 harakat) dan jenisnya',
      metaDescription:
        'Semua hukum mad: mad thabi\u2018i, muttashil, munfashil, lazim, dan \u2018aridh, beserta durasinya dalam harakat serta kesalahan pemanjangan yang umum terjadi.',
      intro:
        'Mad (\u0627\u0644\u0645\u062f) adalah pemanjangan huruf mad (\u0627 \u0648 \u064a) ketika diikuti hamzah atau sukun. Durasinya dihitung dalam harakat, satuan waktu sebuah harakat pendek. Memanjangkan terlalu sedikit atau terlalu lama adalah kesalahan paling umum di kalangan pembaca pemula, dan yang pertama dikoreksi oleh seorang guru.',
      summary:
        'Mad thabi\u2018i berdurasi 2 harakat; mad turunan berdurasi 4, 5, atau 6 harakat tergantung sebabnya (hamzah atau sukun) dan qiraat yang dipilih. Aturan emasnya: pertahankan durasi yang sama dari awal hingga akhir bacaan.',
      items: [
        { arabic: '\u0662', name: 'Mad thabi\u2018i \u2014 mad asli', text: '2 harakat, tanpa hamzah maupun sukun setelah huruf mad. Ini adalah dasar dari semua bacaan.', example: '\u0642\u064e\u0627\u0644\u064e \u2014 dua ketukan pada alif.' },
        { arabic: '\u0664 / \u0665', name: 'Mad muttashil \u2014 bersambung', text: 'Hamzah mengikuti huruf mad dalam satu kata yang sama: 4 hingga 5 harakat, wajib pada semua qiraat.', example: '\u0627\u0644\u0633\u0651\u064e\u0645\u064e\u0627\u0621\u0650 \u2014 pemanjangan wajib sebelum hamzah.' },
        { arabic: '\u0662 / \u0664 / \u0665', name: 'Mad munfashil \u2014 terpisah', text: 'Hamzah membuka kata berikutnya. Durasinya bergantung pada qiraat; pada riwayat Hafsh \u2018an \u2018Ashim, 4 atau 5 harakat.', example: '\u0628\u0650\u0645\u064e\u0627 \u0623\u064f\u0646\u0632\u0650\u0644\u064e \u2014 pertahankan durasi yang sama di seluruh surah.' },
        { arabic: '\u0666', name: 'Mad lazim \u2014 wajib', text: '6 harakat ketika sukun tetap mengikuti huruf mad, terutama pada huruf-huruf terpisah di awal surah.', example: '\u0627\u0644\u0670\u0645\u0670 \u2014 enam ketukan pada mim.' },
        { arabic: '\u0662 / \u0664 / \u0666', name: 'Mad \u2018aridh lissukun \u2014 tidak tetap', text: 'Sukun muncul hanya karena berhenti di akhir ayat: 2, 4, atau 6 harakat, bisa dipilih, tetapi harus konsisten.', example: '\u0627\u0644\u0652\u0639\u064e\u0627\u0644\u064e\u0645\u0650\u064a\u0646\u064e \u2014 saat waqaf, huruf ya dipanjangkan.' },
      ],
      faq: [
        { q: 'Berapa lama satu harakat?', a: 'Satu harakat setara dengan waktu pengucapan satu harakat pendek, kira-kira selama waktu melipat satu jari. Yang penting bukan durasi mutlaknya, melainkan konsistensi antar-mad dengan jenis yang sama.' },
        { q: 'Apa perbedaan antara mad muttashil dan munfashil?', a: 'Pada mad muttashil, huruf mad dan hamzah berada dalam satu kata yang sama, dan pemanjangannya wajib. Pada mad munfashil, hamzah berada di awal kata berikutnya, dan durasinya bervariasi sesuai qiraat.' },
        { q: 'Bagaimana cara memperbaiki mad yang terlalu pendek?', a: 'Hitunglah harakat dengan suara keras pada satu ayat pendek, rekam bacaanmu, lalu bandingkan durasimu dengan qari rujukan. Analisis otomatis atas bacaanmu dapat menandai ayat demi ayat mana mad yang terlalu pendek atau terlalu panjang.' },
      ],
    },
  },
};

// ---- Konten tambahan (waqf-ibtida, qalqalah, FAQ, kuis, link block) ----
import type {
  ExtraTopicSlug,
  FaqPageStrings,
  LinkBlockStrings,
  QuizQuestion,
  QuizStrings,
} from './tajweedExtra';

export const idExtra: {
  topics: Record<ExtraTopicSlug, TopicContent>;
  faqPage: FaqPageStrings;
  quizStrings: QuizStrings;
  linkBlock: LinkBlockStrings;
  quizzes: Record<string, QuizQuestion[]>;
} = {
  topics: {
    'waqf-ibtida': {
      title: 'Waqaf dan ibtida \u2014 berhenti dan memulai kembali',
      h1: 'Waqaf dan ibtida: di mana berhenti dan di mana memulai kembali dalam Al-Qur\u2019an',
      metaTitle: 'Waqaf dan ibtida dalam tajwid: tanda waqaf dan cara memulai',
      metaDescription:
        'Panduan waqaf dan ibtida: tanda waqaf mushaf (\u0645ـ, \ufefb, \u062c, \u0635\u0644\u0649, \u0642\u0644\u0649), jenis waqaf tam, kafi, hasan, qabih, serta cara memulai kembali setelah berhenti.',
      intro:
        'Waqaf (\u0627\u0644\u0648\u0642\u0641) adalah seni berhenti, ibtida (\u0627\u0644\u0627\u0628\u062a\u062f\u0627\u0621) adalah seni memulai kembali. Berhenti di tempat yang salah bisa membalikkan makna sebuah ayat; memulai kembali di tempat yang salah bisa membuatnya tak dapat dipahami. Kedua ilmu ini melengkapi makhraj, sifat, dan mad: keduanya berkaitan dengan makna sebanyak berkaitan dengan bunyi.',
      summary:
        'Empat jenis waqaf (tam, kafi, hasan, qabih), tanda-tanda dalam mushaf, dan kaidah ibtida: mulailah kembali pada kata yang membuka makna yang utuh.',
      items: [
        { arabic: '\u0627\u0644\u0648\u0642\u0641 \u0627\u0644\u062a\u0627\u0645', name: 'Waqaf tam \u2014 berhenti sempurna', text: 'Makna dan tata bahasa sudah lengkap: berhentilah lalu mulai kembali dari kata berikutnya tanpa perlu mengulang ke belakang.', example: '\u0648\u064e\u0623\u064f\u0648\u0644\u064e\u0670\u0626\u0650\u0643\u064e \u0647\u064f\u0645\u064f \u0627\u0644\u0652\u0645\u064f\u0641\u0652\u0644\u0650\u062d\u0648\u0646\u064e' },
        { arabic: '\u0627\u0644\u0648\u0642\u0641 \u0627\u0644\u0643\u0627\u0641\u064a', name: 'Waqaf kafi \u2014 berhenti mencukupi', text: 'Makna sudah lengkap namun secara tata bahasa masih terkait dengan kalimat berikutnya; berhenti diperbolehkan dan dilanjutkan dari kata berikutnya.', example: '\u062e\u064e\u062a\u064e\u0645\u064e \u0627\u0644\u0644\u0651\u0647\u064f \u0639\u064e\u0644\u064e\u0649\u0670 \u0642\u064f\u0644\u0648\u0628\u0650\u0647\u0650\u0645\u0652' },
        { arabic: '\u0627\u0644\u0648\u0642\u0641 \u0627\u0644\u062d\u0633\u0646', name: 'Waqaf hasan \u2014 berhenti baik', text: 'Makna dapat dipahami tetapi masih bergantung pada kalimat berikutnya: boleh berhenti, namun lebih baik mengulang beberapa kata sebelumnya saat memulai kembali.', example: '\u0627\u0644\u0652\u062d\u064e\u0645\u0652\u062f\u064f \u0644\u0650\u0644\u0651\u0647\u0650' },
        { arabic: '\u0627\u0644\u0648\u0642\u0641 \u0627\u0644\u0642\u0628\u064a\u062d', name: 'Waqaf qabih \u2014 berhenti tercela', text: 'Berhenti di sini merusak makna: hal ini dilarang kecuali karena napas habis, dan dalam kondisi itu harus mengulang ke belakang.', example: '\u0641\u064e\u0648\u064e\u064a\u0652\u0644\u064c \u0644\u0651\u0650\u0644\u0652\u0645\u064f\u0635\u064e\u0644\u0651\u0650\u064a\u0646\u064e (tanpa lanjutannya)' },
        { arabic: '\u0627\u0644\u0627\u0628\u062a\u062f\u0627\u0621', name: 'Ibtida \u2014 memulai kembali', text: 'Jangan pernah memulai kembali pada kata yang maknanya bergantung pada kata sebelumnya: kembalilah ke awal kelompok makna.', example: 'mulai kembali dari \u0627\u0644\u0651\u064e\u0630\u0650\u064a\u0646\u064e \u0647\u064f\u0645\u0652 \u0639\u064e\u0646 \u0635\u064e\u0644\u0627\u062a\u0650\u0647\u0650\u0645\u0652 \u0633\u064e\u0627\u0647\u0648\u0646\u064e' },
        { arabic: '\u0635\u0644\u0649 / \u0642\u0644\u0649', name: 'Tanda-tanda mushaf', text: '\u0635\u0644\u0649: lebih baik melanjutkan. \u0642\u0644\u0649: lebih baik berhenti. \u2234 \u2026 \u2234: berhenti pada salah satu dari dua titik saja.', example: 'tanda-tanda waqaf dalam mushaf Madinah' },
      ],
      faq: [
        { q: 'Apa perbedaan antara waqaf dan sakt?', a: 'Waqaf adalah berhenti dengan memutus suara dan mengambil napas. Sakt adalah penghentian suara sejenak tanpa mengambil napas, ditandai dengan huruf \u0633 dalam mushaf, seperti pada \u0639\u0650\u0648\u064e\u062c\u064e\u0627 \u06d8 \u0642\u064e\u064a\u0651\u0650\u0645\u064b\u0627.' },
        { q: 'Bolehkah berhenti di mana saja jika napas habis?', a: 'Ya, berhenti darurat (waqaf idhthirari) diperbolehkan di mana saja. Tetapi harus memulai kembali beberapa kata sebelumnya, pada awal makna yang utuh, agar pesan ayat tidak berubah.' },
        { q: 'Apa arti tanda \ufefb dalam mushaf?', a: 'Tanda ini menunjukkan bahwa tidak boleh berhenti di tempat tersebut, karena berhenti akan merusak makna. Jika napas tetap habis, ulangi bacaan beberapa kata sebelumnya.' },
        { q: 'Apakah waqaf diuji dalam ijazah?', a: 'Ya. Seorang guru (syekh) menilai bukan hanya pelafalan, tetapi juga ketepatan tempat berhenti dan memulai kembali, karena hal ini menunjukkan pemahaman pembaca terhadap teks.' },
      ],
    },
    qalqalah: {
      title: 'Qalqalah \u2014 pantulan suara',
      h1: 'Qalqalah dalam tajwid: huruf, tingkatan, dan contoh dari Al-Qur\u2019an',
      metaTitle: 'Qalqalah: 5 huruf qathbu jad, tingkatan, dan contohnya',
      metaDescription:
        'Semua tentang qalqalah: lima huruf qathbu jad (\u0642 \u0637 \u0628 \u062c \u062f), qalqalah sughra dan kubra, kesalahan umum, dan contoh dari Al-Qur\u2019an.',
      intro:
        'Qalqalah (\u0627\u0644\u0642\u0644\u0642\u0644\u0629) adalah pantulan ringan suara yang menyertai lima huruf ketika bersukun. Qalqalah memberikan kejelasan ritmis pada bacaan: tanpanya, huruf akan teredam; jika berlebihan, akan menambahkan harakat yang tidak ada dalam teks.',
      summary:
        'Lima huruf qathbu jad, perbedaan antara qalqalah sughra (di tengah kata) dan kubra (saat waqaf), serta aturan emasnya: pantulan tegas tanpa tambahan harakat.',
      items: [
        { arabic: '\u0642\u0637\u0628 \u062c\u062f', name: 'Lima huruf qalqalah', text: 'Qaf, tha, ba, jim, dan dal: terkumpul dalam jembatan hafalan \u0642\u0637\u0628 \u062c\u062f, hanya huruf-huruf inilah yang memantul.', example: '\u0623\u064e\u0628\u0652\u0635\u064e\u0627\u0631\u0650\u0647\u0650\u0645\u0652 \u2014 pantulan pada ba sukun.' },
        { arabic: '\u0627\u0644\u0635\u063a\u0631\u0649', name: 'Qalqalah sughra \u2014 kecil', text: 'Huruf bersukun di tengah kata: pantulannya ringan dan cepat, tanpa memanjangkan suku kata.', example: '\u064a\u064e\u062c\u0652\u0639\u064e\u0644\u0648\u0646\u064e \u2014 pantulan samar pada jim.' },
        { arabic: '\u0627\u0644\u0643\u0628\u0631\u0649', name: 'Qalqalah kubra \u2014 besar', text: 'Huruf berada di akhir kata dan bacaan berhenti di situ: pantulannya lebih jelas, tanpa pernah menambahkan harakat.', example: '\u0642\u064f\u0644\u0652 \u0647\u064f\u0648\u064e \u0627\u0644\u0644\u0651\u0647\u064f \u0623\u064e\u062d\u064e\u062f\u0652' },
        { arabic: '\u0627\u0644\u0645\u0634\u062f\u062f\u0629', name: 'Qalqalah pada huruf bertasydid', text: 'Saat berhenti pada huruf qalqalah yang bertasydid, tahan dulu tasydidnya kemudian pantulkan hanya sekali.', example: '\u062a\u064e\u0628\u0651\u064e\u062a\u0652 \u064a\u064e\u062f\u064e\u0627 \u0623\u064e\u0628\u0650\u064a \u0644\u064e\u0647\u064e\u0628\u064d \u0648\u064e\u062a\u064e\u0628\u0651\u064e' },
        { arabic: '\u0627\u0644\u0623\u062e\u0637\u0627\u0621', name: 'Kesalahan umum', text: 'Menambahkan fathah atau dhammah pada pantulan, melewatkan qalqalah di tengah kata, atau memantulkan huruf yang bukan qalqalah (\u062a, \u0643).', example: '\u064a\u064e\u0642\u0652\u0637\u064e\u0639\u0648\u0646\u064e \u2014 jangan diucapkan "yaqa-tha\u2018\u016bn".' },
      ],
      faq: [
        { q: 'Apa saja huruf qalqalah?', a: 'Lima huruf yang terkumpul dalam kata \u0642\u0637\u0628 \u062c\u062f: qaf, tha, ba, jim, dan dal. Huruf-huruf ini memantul setiap kali bersukun, baik di tengah kata maupun saat waqaf.' },
        { q: 'Apa perbedaan antara qalqalah sughra dan kubra?', a: 'Qalqalah sughra terjadi di tengah kata dengan sukun asli: pantulannya ringan. Qalqalah kubra terjadi di akhir kata saat berhenti: pantulannya lebih terasa.' },
        { q: 'Apakah qalqalah menambahkan harakat?', a: 'Tidak. Pantulan tersebut tidak boleh berubah menjadi fathah, kasrah, atau dhammah. Itu hanyalah gema sederhana dari huruf tanpa warna vokal yang jelas.' },
        { q: 'Bagaimana cara berlatih qalqalah?', a: 'Bacalah surah Al-Ikhlas dan Al-Masad sambil menandai setiap sukun dari huruf \u0642\u0637\u0628 \u062c\u062f, rekam bacaanmu, lalu bandingkan dengan qari rujukan. Analisis otomatis ayat demi ayat dapat menandai pantulan yang kurang atau berlebihan.' },
      ],
    },
  },
  faqPage: {
    metaTitle: 'FAQ tajwid: kumpulan pertanyaan seputar tajwid',
    metaDescription:
      'Kumpulan tanya jawab tajwid: makhraj, sifat, mad, qalqalah, waqaf, dan ibtida. Jawaban singkat dan tepercaya untuk memperbaiki bacaan Al-Qur\u2019anmu.',
    h1: 'FAQ tajwid: semua pertanyaan yang sering diajukan',
    intro:
      'Halaman ini merangkum pertanyaan paling sering diajukan tentang tajwid, dikelompokkan berdasarkan pelajaran: makharijul huruf, sifatul huruf, mad, qalqalah, serta waqaf dan ibtida. Setiap bagian tertaut ke pelajaran lengkap yang sesuai.',
    linkLabel: 'Semua pertanyaan yang sering diajukan',
    sectionAll: 'Pertanyaan umum',
    backToHub: 'Kembali ke panduan tajwid',
  },
  quizStrings: {
    heading: 'Kuis: uji pengetahuanmu',
    intro: 'Lima soal pilihan ganda dengan koreksi langsung.',
    check: 'Periksa',
    next: 'Soal berikutnya',
    restart: 'Ulangi',
    correct: 'Jawaban benar',
    wrong: 'Jawaban salah',
    result: 'Skormu',
    best: 'Skor terbaik',
    progress: 'Soal',
  },
  linkBlock: {
    heading: 'Lanjutkan dengan pelajaran tajwid lainnya',
    intro: 'Setiap pelajaran membahas satu hukum lengkap dengan contoh dari Al-Qur\u2019an, kesalahan umum, dan kuis.',
  },
  quizzes: {
    makharij: [
      { q: 'Ada berapa titik makhraj (makharijul huruf)?', options: ['5', '17', '28'], answer: 1, explanation: '17 makhraj tersebar di 5 area, menurut Ibnul Jazari.' },
      { q: 'Dari area mana huruf mad \u0627 \u0648 \u064a keluar?', options: ['Al-jauf', 'Al-halq', 'Asy-syafatan'], answer: 0, explanation: 'Huruf-huruf ini keluar dari rongga kosong mulut (al-jauf).' },
      { q: 'Huruf mana yang keluar dari bibir bawah bertemu gigi seri atas?', options: ['Ba', 'Fa', 'Mim'], answer: 1, explanation: 'Fa: bibir bawah bertemu gigi seri atas.' },
      { q: 'Dari mana ghunnah berasal?', options: ['Al-khaisyum', 'Al-lisan', 'Al-halq'], answer: 0, explanation: 'Ghunnah keluar dari rongga hidung, al-khaisyum.' },
      { q: 'Kesalahan makhraj mana yang termasuk lahn jali?', options: ['Mengucapkan ain seperti hamzah', 'Memanjangkan mad 5 harakat, bukan 4', 'Tidak menandai qalqalah'], answer: 0, explanation: 'Mengubah makhraj mengubah kata itu sendiri: ini kesalahan besar.' },
    ],
    sifat: [
      { q: 'Huruf apa saja yang memiliki qalqalah?', options: ['\u0641\u062d\u062b\u0647 \u0634\u062e\u0635 \u0633\u0643\u062a', '\u0642\u0637\u0628 \u062c\u062f', '\u062e\u0635 \u0636\u063a\u0637 \u0642\u0638'], answer: 1, explanation: '\u0642\u0637\u0628 \u062c\u062f mengumpulkan lima huruf qalqalah.' },
      { q: 'Apa arti hams?', options: ['Napas mengalir', 'Suara berhenti', 'Huruf itu tebal'], answer: 0, explanation: 'Hams: napas tetap mengalir bersama huruf.' },
      { q: 'Huruf ra setelah kasrah dibaca...', options: ['Selalu tebal', 'Tipis (tarqiq)', 'Didengungkan'], answer: 1, explanation: 'Setelah kasrah, ra dibaca tipis.' },
      { q: 'Sifat mana yang tidak memiliki lawan?', options: ['Syiddah', 'Jahr', 'Shafir'], answer: 2, explanation: 'Shafir termasuk sifat yang tidak berlawanan.' },
      { q: 'Mengapa \u062a dan \u0637 berbeda?', options: ['Karena sifatnya', 'Karena makhrajnya', 'Karena madnya'], answer: 0, explanation: 'Makhrajnya sangat berdekatan; sifatlah yang membedakan keduanya.' },
    ],
    madd: [
      { q: 'Berapa harakat durasi mad thabi\u2018i?', options: ['2', '4', '6'], answer: 0, explanation: 'Mad thabi\u2018i berdurasi 2 harakat.' },
      { q: 'Mad lazim berdurasi...', options: ['2 harakat', '4 harakat', '6 harakat'], answer: 2, explanation: '6 harakat, dengan sukun tetap setelah huruf mad.' },
      { q: 'Pada mad muttashil, hamzah berada...', options: ['Dalam kata yang sama', 'Di awal kata berikutnya', 'Tidak ada'], answer: 0, explanation: 'Muttashil = bersambung: hamzah dalam kata yang sama, pemanjangan wajib.' },
      { q: 'Contoh \u0627\u0644\u0670\u0645\u0670 termasuk jenis mad apa?', options: ['Munfashil', 'Lazim', 'Aridh'], answer: 1, explanation: 'Huruf-huruf terpisah di awal surah termasuk mad lazim.' },
      { q: 'Mad \u2018aridh lissukun muncul...', options: ['Saat berhenti di akhir ayat', 'Sebelum setiap hamzah', 'Hanya pada riwayat Warsy'], answer: 0, explanation: 'Sukunnya bersifat sementara, disebabkan oleh waqaf.' },
    ],
    'waqf-ibtida': [
      { q: 'Waqaf tam berarti...', options: ['Maknanya sudah lengkap', 'Dilarang berhenti', 'Harus mengulang ke belakang'], answer: 0, explanation: 'Makna dan tata bahasa lengkap: tempat berhenti yang ideal.' },
      { q: 'Tanda \ufefb menunjukkan...', options: ['Berhenti wajib', 'Jangan berhenti', 'Berhenti lebih baik'], answer: 1, explanation: '\ufefb menandai waqaf mamnu\u2018.' },
      { q: 'Setelah berhenti darurat, bacaan dimulai kembali dari...', options: ['Kata berikutnya', 'Beberapa kata sebelumnya', 'Awal surah'], answer: 1, explanation: 'Mulai kembali dari awal makna yang utuh.' },
      { q: 'Sakt adalah...', options: ['Berhenti sambil bernapas', 'Berhenti tanpa mengambil napas', 'Pemanjangan 6 harakat'], answer: 1, explanation: 'Sakt memutus suara, bukan napas.' },
      { q: 'Waqaf qabih adalah...', options: ['Dianjurkan', 'Tercela karena merusak makna', 'Netral'], answer: 1, explanation: 'Berhenti di sana mengubah makna ayat.' },
    ],
    qalqalah: [
      { q: 'Berapa huruf yang memiliki qalqalah?', options: ['3', '5', '7'], answer: 1, explanation: 'Lima huruf: \u0642 \u0637 \u0628 \u062c \u062f.' },
      { q: 'Qalqalah kubra terjadi...', options: ['Di tengah kata', 'Saat berhenti di akhir kata', 'Sebelum hamzah'], answer: 1, explanation: 'Qalqalah besar: saat berhenti pada huruf terakhir.' },
      { q: 'Apakah qalqalah menambahkan harakat?', options: ['Ya, fathah', 'Tidak, sama sekali', 'Ya, dhammah'], answer: 1, explanation: 'Itu adalah pantulan tegas tanpa warna vokal.' },
      { q: 'Huruf mana yang tidak memiliki qalqalah?', options: ['Kaf', 'Jim', 'Dal'], answer: 0, explanation: 'Kaf bukan bagian dari \u0642\u0637\u0628 \u062c\u062f.' },
      { q: 'Saat berhenti pada \u062a\u064e\u0628\u0651\u064e\u062a\u0652 \u064a\u064e\u062f\u064e\u0627 \u0623\u064e\u0628\u0650\u064a \u0644\u064e\u0647\u064e\u0628\u064d \u0648\u064e\u062a\u064e\u0628\u0651\u064e, kita...', options: ['Memantulkan sekali setelah tasydid', 'Memantulkan dua kali', 'Tidak memantulkan sama sekali'], answer: 0, explanation: 'Tahan tasydidnya, lalu pantulkan satu kali.' },
    ],
  },
};
