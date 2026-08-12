/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from 'react';

const LANGUAGE = new URLSearchParams(window.location.search).get('lang') === 'tr' ? 'tr' : 'en';

const INDICATORS_TR = {
  inflation: { label: 'Enflasyon', description: 'Tüketici fiyatları enflasyonu, yıllık %.', unit: '%' },
  growth: { label: 'GSYH büyümesi', description: 'Reel GSYH büyümesi, yıllık %.', unit: '%' },
  unemployment: { label: 'İşsizlik', description: 'Toplam iş gücünün yüzdesi olarak işsizlik (ILO tahmini).', unit: '%' },
  debt: { label: 'Kamu borcu', description: 'Merkezi yönetim toplam borcu, GSYH yüzdesi.', unit: 'GSYH yüzdesi' },
  currentAccount: { label: 'Cari denge', description: 'Cari işlemler dengesi, GSYH yüzdesi.', unit: 'GSYH yüzdesi' },
  reserves: { label: 'Rezerv yeterliliği', description: 'İthalatı karşılama ayı olarak toplam rezervler.', unit: 'aylık ithalat' },
  stability: { label: 'Siyasi istikrar', description: 'Siyasi istikrar ve şiddet/terörizmin yokluğu.' },
  ruleOfLaw: { label: 'Hukukun üstünlüğü', description: 'Toplum kurallarına güven ve uyum.' },
  corruption: { label: 'Yolsuzluğun kontrolü', description: 'Kamu gücünün özel çıkar için kullanılma düzeyi.' },
  effectiveness: { label: 'Yönetim etkinliği', description: 'Kamu hizmetlerinin ve politika uygulamasının kalitesi.' },
  voice: { label: 'Katılım ve hesap verebilirlik', description: 'İfade ve örgütlenme özgürlüğü ile özgür medya.' },
  regulation: { label: 'Düzenleme kalitesi', description: 'Sağlam politika ve düzenlemeler oluşturma kabiliyeti.' },
};

const REGIONS_TR = {
  'East Asia & Pacific': 'Doğu Asya ve Pasifik',
  'Europe & Central Asia': 'Avrupa ve Orta Asya',
  'Latin America & Caribbean': 'Latin Amerika ve Karayipler',
  'Middle East, North Africa, Afghanistan & Pakistan': 'Orta Doğu, Kuzey Afrika, Afganistan ve Pakistan',
  'North America': 'Kuzey Amerika',
  'South Asia': 'Güney Asya',
  'Sub-Saharan Africa': 'Sahra Altı Afrika',
};

const INCOME_TR = {
  'High income': 'Yüksek gelir',
  'Upper middle income': 'Üst orta gelir',
  'Lower middle income': 'Alt orta gelir',
  'Low income': 'Düşük gelir',
  'Not classified': 'Sınıflandırılmamış',
};

const VALIDATION_TR = {
  'Control of corruption': 'Yolsuzluğun kontrolü',
  'Rule of law': 'Hukukun üstünlüğü',
  'Voice and accountability': 'Katılım ve hesap verebilirlik',
  'Governance pillar': 'Yönetişim sütunu',
  'Political stability': 'Siyasi istikrar',
  'Composite risk': 'Bileşik risk',
  'Economic pillar': 'Ekonomi sütunu',
};

const LITERATURE_ROLES_TR = {
  kkm2010: 'Yönetişim girdilerinin nasıl oluşturulduğunu açıklar: onlarca temel kaynağı altı toplu ölçüde birleştiren gözlenemeyen bileşenler modeli.',
  langbein2010: 'Altı WGI ölçütünün ampirik olarak ayrı olmadığını ve büyük ölçüde tek bir boyutu yansıttığını savunur. Buradaki tekrar tanısı güncel verilerde bunu yeniden üretir.',
  thomas2010: 'WGI göstergelerinin adlandırıldıkları kavramları gerçekten ölçüp ölçmediğini sorgular. Bulgular bölümündeki dış kontroller bu projede verilebilen yanıttır.',
  oman2006: 'Algı yanlılığını ve yönetişim göstergelerini zaman içinde karşılaştırılabilir kabul etmenin risklerini ele alır. Eğilimlerin kesin yıllık değişim yerine sabit bir referans dağılımındaki hareket olarak okunmasının nedeni budur.',
  oecd2008: 'Burada kullanılan bileşik gösterge adımlarının kaynağıdır: normalizasyon, farklı ağırlık için dayanak yoksa eşit ağırlık ve endeksle birlikte belirsizlik ile duyarlılık analizinin yayımlanması.',
};

const SOURCE_DESCRIPTIONS_TR = {
  'Macro-economic indicators.': 'Makroekonomik göstergeler.',
  'Governance scores, regions and income groups.': 'Yönetişim puanları, bölgeler ve gelir grupları.',
  'Expert-coded institutional indices, used as an independent check on the governance pillar.': 'Yönetişim sütununun bağımsız kontrolü olarak kullanılan uzman kodlu kurumsal endeksler.',
  'Deaths per 100,000 in ongoing armed conflicts, used as an outcome measure.': 'Sonuç ölçütü olarak kullanılan, devam eden silahlı çatışmalarda yüz bin kişi başına ölüm.',
};

const COPY = {
  en: {
    app: {
      loading: 'Loading country risk data…',
      loadError: 'The risk dataset could not be loaded.',
      reload: 'Reload',
      tagline: 'country risk from open data',
      findings: 'Findings',
      searchCountries: 'Search countries',
      switchBasemap: (name) => `Switch to ${name} basemap`,
      basemap: (name) => `Basemap: ${name}`,
      dark: 'dark',
      satellite: 'satellite',
      openRanking: 'Open ranking',
      methodology: 'How the score is built',
      selectedRisk: (name, score) => `${name}, composite risk ${score} out of 100`,
      noCountry: 'No country selected',
      generated: 'Data generated',
    },
    error: { panel: 'Something went wrong in this panel.', retry: 'Try again' },
    map: { zoomIn: 'Zoom in', zoomOut: 'Zoom out', tiles: 'Tiles', source: 'Source' },
    weight: {
      blend: 'Blend', eco: 'eco', gov: 'gov',
      label: 'Weight given to the economic pillar versus governance',
      value: (economic, governance) => `${economic}% economic, ${governance}% governance`,
    },
    ranking: {
      riskiest: 'Riskiest first', safest: 'Safest first', finding: 'Political and economic risk barely overlap',
      seeData: 'See what the data shows →', search: 'Search countries', regionFilter: 'Filter by region', allRegions: 'All regions',
      sortedBy: (label) => `Sorted by ${label}. Click to reverse.`, aria: 'Country risk ranking', empty: 'No country matches these filters.',
      limited: 'Limited data — scored from a single pillar', trend: (name) => `${name} risk trend`,
    },
    legend: {
      score: 'Risk score', scored: (scored, total) => `${scored}/${total} scored`, filter: 'Filter countries by risk band',
      title: (label, range) => `${label} (score ${range})`, note: 'Bands are global quintiles of the current blend.', clear: 'Clear filter',
      shortBands: { 'very-low': 'Bottom', low: 'Low', medium: 'Mid', high: 'High', critical: 'Top' },
    },
    search: {
      dialog: 'Search countries', placeholder: 'Search a country…', input: 'Search a country', close: 'Close search',
      results: 'Search results', empty: (query) => `No country matches “${query}”.`, navigate: 'navigate', select: 'select', closeShort: 'close',
    },
    country: {
      detail: (name) => `${name} risk detail`, close: 'Close country detail', composite: 'Composite risk', noData: 'No data',
      rank: (rank, percentile) => `#${rank} riskiest · ${percentile}th percentile`, trajectory: 'Risk trajectory', noTrajectory: 'No trajectory available',
      points: 'pts', since: 'since', economic: 'Economic risk', governance: 'Governance risk', notAvailable: 'n/a',
      history: (label) => `${label} history`, coverage: (value) => `${value}% of the model weight is backed by data`,
      excluded: ' — excluded from the headline score',
    },
    context: {
      title: 'In context', inRegion: (region) => `In ${region}`, riskiest: (position, total) => `#${position} of ${total} riskiest`,
      incomeGroup: 'Income group', ofTotal: (position, total) => `#${position} of ${total}`, closest: 'Closest scores worldwide',
    },
    scatter: {
      aria: (count) => `Scatter plot of economic risk against governance risk for ${count} countries`,
      point: (name, economic, governance) => `${name} — economic ${economic}, governance ${governance}`,
      economic: 'Economic risk →', governance: 'Governance risk →',
    },
    confidence: {
      high: ['High confidence', 'Both pillars are backed by recent data.'],
      medium: ['Medium confidence', 'Some indicators are missing or a few years old.'],
      low: ['Limited data', 'Only one pillar could be scored; treat the number as indicative.'],
    },
    bands: {
      'very-low': 'Lowest 20%', low: 'Low', medium: 'Medium', high: 'High', critical: 'Highest 20%',
    },
    methodology: {
      title: 'How the score is built', close: 'Close', introBefore: 'Twelve published indicators, recomputed from scratch by an automated pipeline. Every value is converted into a',
      percentile: 'percentile rank', introAfter: 'against a reference distribution pooled over every country and every year in the dataset, the ranks are averaged into two pillars, and the pillars are blended into the composite. The blend is the only number you can change — and the only one that meaningfully moves the ranking.',
      whyPercentiles: 'Why percentiles rather than thresholds', percentilesBody: 'Deciding that 2% inflation scores zero and 50% scores a hundred would be an opinion dressed as a measurement. Percentile ranks ask how a country compares with every country-year on record and put every indicator on the same footing.',
      whyWeights: 'Why equal weights', weightsBody: 'Where there is no theoretical or statistical basis for differential weights, standard practice is to weight equally and publish a sensitivity analysis instead of inventing numbers.',
      rankStability: 'Rank stability', pillarsOverlap: 'Pillars overlap', governanceRedundancy: 'Governance redundancy', economicRedundancy: 'Economic redundancy',
      rankBody: (draws, minimum) => `Median Spearman correlation across ${draws} random weightings. Worst draw: ${minimum}.`,
      overlapBody: 'Correlation between the economic and governance pillars. Near zero means they carry independent information.',
      governanceBody: 'Mean pairwise correlation inside governance. The measures largely track one underlying construct.',
      economicBody: 'The same figure for economics. Near zero means the six indicators are separate signals.',
      economicPillar: 'Economic pillar', economicNote: 'World Bank Open Data. Six indicators, equally weighted.',
      governancePillar: 'Governance pillar', governanceNote: 'Worldwide Governance Indicators, published on a 0-100 scale where higher is better governed.',
      higher: 'higher = riskier', lower: 'lower = riskier', missing: 'Missing data',
      missingBody: 'Indicators are not published for every country. Observations older than six years count as missing; surviving indicators are averaged and coverage is reported. Countries with one usable pillar remain ranked but are flagged as limited data.',
      bands: 'Bands', bandsBody: 'Colours are global quintiles of the current blend, so each band holds a fifth of scored countries.',
      literature: 'Literature', sources: 'Sources', limitations: 'Limitations.',
      limitationsBody: 'This is an open-data project, not an investment or travel advisory. Governance indicators lag reality. Percentile ranks are ordinal, and averaging the pillars lets strength in one offset weakness in the other — which is why components stay visible.',
      footer: (date, count, range) => `Data generated ${date} · ${count} countries · indicator years ${range}`,
    },
    findings: {
      title: 'What the data shows', close: 'Close', mainTitle: 'Political risk and economic risk are not the same thing',
      mainBody: (count, correlation) => `Across ${count} countries, the two pillars correlate at r ${correlation}. Institutional risk tells you close to nothing about macroeconomic risk.`,
      cloud: 'If they measured the same thing, the cloud would be a diagonal line. It is a blob.',
      scatterNote: 'One dot per country, coloured by composite band. Click a dot to open it.',
      oneNumber: 'Why one number hides things', economic: 'Economic', governance: 'Governance',
      mirrors: (first, second) => `Near-identical composites, opposite profiles. ${first} carries institutional risk with a steadier macroeconomy; ${second} is the reverse. Keeping both pillars visible preserves the distinction.`,
      outside: 'Does the score survive an outside check?', outsideBody: 'A composite can be internally tidy and still measure nothing. Two tests run on every build against sources this project does not control.',
      validationMethod: 'Spearman rank correlation against each country’s latest available observation.',
      institutions: 'Against expert-coded institutions (V-Dem)', institutionsBody: 'Governance here uses perception surveys. V-Dem uses country experts coding explicit definitions, so agreement is not guaranteed.',
      outcome: 'Against an outcome (conflict deaths, UCDP)', outcomeBody: 'Conflict deaths per 100,000 are an observed outcome rather than a perception.',
      conclusion: 'Political stability tracks actual conflict deaths while the economic pillar does not. The composite predicts violence less well than stability alone, so one risk number is the wrong tool for that question.',
      footer: 'Recomputed on every data refresh — figures come from the published dataset, not hand-written copy.',
    },
  },
  tr: {
    app: {
      loading: 'Ülke risk verileri yükleniyor…',
      loadError: 'Risk veri kümesi yüklenemedi.',
      reload: 'Yeniden yükle',
      tagline: 'açık verilerden ülke riski',
      findings: 'Bulgular',
      searchCountries: 'Ülke ara',
      switchBasemap: (name) => `${name} haritaya geç`,
      basemap: (name) => `Altlık: ${name}`,
      dark: 'koyu',
      satellite: 'uydu',
      openRanking: 'Sıralamayı aç',
      methodology: 'Puan nasıl oluşturuluyor',
      selectedRisk: (name, score) => `${name}, bileşik risk 100 üzerinden ${score}`,
      noCountry: 'Ülke seçilmedi',
      generated: 'Veri üretim tarihi',
    },
    error: { panel: 'Bu panelde bir hata oluştu.', retry: 'Yeniden dene' },
    map: { zoomIn: 'Yakınlaştır', zoomOut: 'Uzaklaştır', tiles: 'Döşemeler', source: 'Kaynak' },
    weight: {
      blend: 'Karışım', eco: 'eko', gov: 'yön.',
      label: 'Ekonomi ve yönetişim sütunlarına verilen ağırlık',
      value: (economic, governance) => `%${economic} ekonomi, %${governance} yönetişim`,
    },
    ranking: {
      riskiest: 'En riskli önce', safest: 'En güvenli önce', finding: 'Siyasi ve ekonomik risk neredeyse örtüşmüyor',
      seeData: 'Verilerin ne söylediğini gör →', search: 'Ülke ara', regionFilter: 'Bölgeye göre filtrele', allRegions: 'Tüm bölgeler',
      sortedBy: (label) => `${label} sıralaması. Tersine çevirmek için tıklayın.`, aria: 'Ülke risk sıralaması', empty: 'Bu filtrelerle eşleşen ülke yok.',
      limited: 'Sınırlı veri — tek bir sütundan puanlandı', trend: (name) => `${name} risk eğilimi`,
    },
    legend: {
      score: 'Risk puanı', scored: (scored, total) => `${scored}/${total} puanlandı`, filter: 'Ülkeleri risk bandına göre filtrele',
      title: (label, range) => `${label} (puan ${range})`, note: 'Bantlar, mevcut karışımın küresel beşlik dilimleridir.', clear: 'Filtreyi temizle',
      shortBands: { 'very-low': 'Alt %20', low: 'Düşük', medium: 'Orta', high: 'Yüksek', critical: 'Üst %20' },
    },
    search: {
      dialog: 'Ülke ara', placeholder: 'Bir ülke ara…', input: 'Bir ülke ara', close: 'Aramayı kapat',
      results: 'Arama sonuçları', empty: (query) => `“${query}” ile eşleşen ülke yok.`, navigate: 'gezin', select: 'seç', closeShort: 'kapat',
    },
    country: {
      detail: (name) => `${name} risk ayrıntısı`, close: 'Ülke ayrıntısını kapat', composite: 'Bileşik risk', noData: 'Veri yok',
      rank: (rank, percentile) => `Risk sırası #${rank} · ${percentile}. yüzdelik`, trajectory: 'Risk eğilimi', noTrajectory: 'Eğilim verisi yok',
      points: 'puan', since: 'yılından beri', economic: 'Ekonomik risk', governance: 'Yönetişim riski', notAvailable: 'yok',
      history: (label) => `${label} geçmişi`, coverage: (value) => `Model ağırlığının %${value} kadarı veriyle destekleniyor`,
      excluded: ' — ana puana dahil edilmedi',
    },
    context: {
      title: 'Bağlam içinde', inRegion: (region) => `${region} içinde`, riskiest: (position, total) => `En riskli ${total} içinde #${position}`,
      incomeGroup: 'Gelir grubu', ofTotal: (position, total) => `${total} içinde #${position}`, closest: 'Dünya genelinde en yakın puanlar',
    },
    scatter: {
      aria: (count) => `${count} ülke için ekonomik risk ve yönetişim riski dağılımı`,
      point: (name, economic, governance) => `${name} — ekonomi ${economic}, yönetişim ${governance}`,
      economic: 'Ekonomik risk →', governance: 'Yönetişim riski →',
    },
    confidence: {
      high: ['Yüksek güven', 'Her iki sütun da güncel verilerle destekleniyor.'],
      medium: ['Orta güven', 'Bazı göstergeler eksik veya birkaç yıl eski.'],
      low: ['Sınırlı veri', 'Yalnızca bir sütun puanlanabildi; sayı gösterge niteliğindedir.'],
    },
    bands: {
      'very-low': 'En düşük %20', low: 'Düşük', medium: 'Orta', high: 'Yüksek', critical: 'En yüksek %20',
    },
    methodology: {
      title: 'Puan nasıl oluşturuluyor', close: 'Kapat', introBefore: 'Otomatik veri hattının sıfırdan yeniden hesapladığı on iki yayımlanmış gösterge. Her değer, veri kümesindeki tüm ülke ve yılların ortak referans dağılımına göre bir',
      percentile: 'yüzdelik sıraya', introAfter: 'dönüştürülür; sıralar iki sütunda ortalanır ve sütunlar bileşik puanda birleştirilir. Değiştirilebilen tek sayı karışımdır ve sıralamayı anlamlı ölçüde hareket ettiren de odur.',
      whyPercentiles: 'Neden eşikler yerine yüzdelikler?', percentilesBody: 'Enflasyonda %2 için sıfır, %50 için yüz puan belirlemek ölçüm kılığında bir görüş olurdu. Yüzdelik sıra, ülkeyi kayıttaki tüm ülke-yıllarla karşılaştırır ve göstergeleri ortak zemine taşır.',
      whyWeights: 'Neden eşit ağırlık?', weightsBody: 'Farklı ağırlıklar için kuramsal veya istatistiksel dayanak yoksa standart uygulama sayı uydurmak yerine eşit ağırlık kullanmak ve duyarlılık analizi yayımlamaktır.',
      rankStability: 'Sıralama kararlılığı', pillarsOverlap: 'Sütunların örtüşmesi', governanceRedundancy: 'Yönetişim tekrarı', economicRedundancy: 'Ekonomi tekrarı',
      rankBody: (draws, minimum) => `${draws} rastgele ağırlıklandırmada medyan Spearman korelasyonu. En kötü çekiliş: ${minimum}.`,
      overlapBody: 'Ekonomi ve yönetişim sütunları arasındaki korelasyon. Sıfıra yakın değer, bağımsız bilgi taşıdıklarını gösterir.',
      governanceBody: 'Yönetişim içindeki ortalama ikili korelasyon. Ölçüler büyük ölçüde tek bir temel yapıyı izler.',
      economicBody: 'Ekonomi sütunu için aynı ölçü. Sıfıra yakın değer, altı göstergenin ayrı sinyaller olduğunu gösterir.',
      economicPillar: 'Ekonomi sütunu', economicNote: 'Dünya Bankası Açık Verileri. Altı gösterge, eşit ağırlık.',
      governancePillar: 'Yönetişim sütunu', governanceNote: 'Dünya Yönetişim Göstergeleri; yüksek puanın daha iyi yönetişim anlamına geldiği 0-100 ölçeği.',
      higher: 'yüksek = daha riskli', lower: 'düşük = daha riskli', missing: 'Eksik veri',
      missingBody: 'Göstergeler her ülke için yayımlanmaz. Altı yıldan eski gözlemler eksik sayılır; kalan göstergelerin ortalaması alınır ve kapsam bildirilir. Tek kullanılabilir sütunu kalan ülkeler sıralamada tutulur ancak sınırlı veri olarak işaretlenir.',
      bands: 'Bantlar', bandsBody: 'Renkler mevcut karışımın küresel beşlik dilimleridir; her bant puanlanan ülkelerin beşte birini içerir.',
      literature: 'Literatür', sources: 'Kaynaklar', limitations: 'Sınırlamalar.',
      limitationsBody: 'Bu bir açık veri projesidir; yatırım veya seyahat tavsiyesi değildir. Yönetişim göstergeleri gerçeği gecikmeli izler. Yüzdelik sıralar dereceseldir ve sütunların ortalaması birindeki gücün diğerindeki zayıflığı telafi etmesine izin verir; bileşenlerin görünür kalmasının nedeni budur.',
      footer: (date, count, range) => `Veri üretim tarihi ${date} · ${count} ülke · gösterge yılları ${range}`,
    },
    findings: {
      title: 'Veriler ne söylüyor?', close: 'Kapat', mainTitle: 'Siyasi risk ile ekonomik risk aynı şey değildir',
      mainBody: (count, correlation) => `${count} ülkede iki sütun arasındaki korelasyon r ${correlation}. Kurumsal risk puanı, makroekonomik risk hakkında neredeyse hiçbir şey söylemez.`,
      cloud: 'Aynı şeyi ölçselerdi aşağıdaki bulut çapraz bir çizgi olurdu. Oysa bir yığın.',
      scatterNote: 'Her nokta bir ülkeyi, renk bileşik bandı gösterir. Açmak için noktaya tıklayın.',
      oneNumber: 'Tek sayı neden ayrıntıları gizler?', economic: 'Ekonomi', governance: 'Yönetişim',
      mirrors: (first, second) => `Neredeyse aynı bileşik puanlar, zıt profiller. ${first} daha istikrarlı makroekonomiyle kurumsal risk taşırken ${second} tersidir. İki sütunu görünür tutmak bu ayrımı korur.`,
      outside: 'Puan dış kontrolden geçiyor mu?', outsideBody: 'Bileşik ölçü kendi içinde düzenli olup hiçbir şeyi ölçmeyebilir. Her build, projenin kontrol etmediği kaynaklara karşı iki test çalıştırır.',
      validationMethod: 'Her ülkenin mevcut en güncel gözlemine karşı Spearman sıra korelasyonu.',
      institutions: 'Uzman kodlu kurumlara karşı (V-Dem)', institutionsBody: 'Buradaki yönetişim verileri algı anketlerinden gelir. V-Dem açık tanımlarla çalışan ülke uzmanlarına dayanır; dolayısıyla uyum tasarım gereği değildir.',
      outcome: 'Bir sonuca karşı (çatışma ölümleri, UCDP)', outcomeBody: 'Devam eden silahlı çatışmalarda yüz bin kişi başına ölüm, algı değil gözlenen bir sonuçtur.',
      conclusion: 'Siyasi istikrar gerçek çatışma ölümlerini izlerken ekonomi sütunu izlemez. Bileşik puan şiddeti tek başına istikrar bileşeninden daha kötü tahmin eder; bu soru için tek risk sayısı yanlış araçtır.',
      footer: 'Her veri yenilemesinde yeniden hesaplanır; rakamlar elle yazılmaz, yayımlanmış veri kümesinden okunur.',
    },
  },
};

export const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const language = LANGUAGE;
  const copy = COPY[language];
  const countryNames = new Intl.DisplayNames([language === 'tr' ? 'tr-TR' : 'en-US'], { type: 'region' });

  useEffect(() => {
    document.documentElement.lang = language === 'tr' ? 'tr' : 'en';
    document.title = language === 'tr' ? 'Glorisk — açık verilerden ülke riski' : 'Glorisk — country risk from open data';
  }, [language]);

  const value = {
    language,
    locale: language === 'tr' ? 'tr-TR' : 'en-US',
    copy,
    indicator: (definition) => language === 'tr' ? { ...definition, ...(INDICATORS_TR[definition.key] ?? {}) } : definition,
    bandLabel: (band) => copy.bands[band?.id] ?? band?.label ?? '',
    confidence: (level) => copy.confidence[level] ?? ['', ''],
    regionLabel: (region) => language === 'tr' ? REGIONS_TR[region] ?? region : region,
    incomeLabel: (income) => language === 'tr' ? INCOME_TR[income] ?? income : income,
    countryName: (country) => {
      if (language !== 'tr' || !country?.iso2) return country?.name ?? '';
      try {
        return countryNames.of(country.iso2.toUpperCase()) ?? country.name;
      } catch {
        return country.name;
      }
    },
    validationLabel: (label) => language === 'tr' ? VALIDATION_TR[label] ?? label : label,
    literatureRole: (work) => language === 'tr' ? LITERATURE_ROLES_TR[work.id] ?? work.role : work.role,
    sourceDescription: (description) => language === 'tr' ? SOURCE_DESCRIPTIONS_TR[description] ?? description : description,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}
