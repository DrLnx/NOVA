/**
 * Stopwords and the cross-language entity bridge used by clustering and search.
 * Kept separate from the algorithm so the word lists can be edited without
 * touching the maths.
 */
import { fold } from './text';

const DE_STOPWORDS = `
aber alle allem allen aller alles als also andere anderem anderen anderer anderes auch auf aus
bei beim bin bis bist beide beiden bereits besonders bleibt
da dabei dadurch dafür dagegen daher damit danach dann daran darauf darin darüber darum dass
dazu dein deine dem den denen denn der deren des dessen deshalb die dies diese diesem
diesen dieser dieses doch dort drei durch
ein eine einem einen einer eines einige einigen einmal er erst erste ersten es etwa etwas euer
fast für
gab ganz gar geben gegen gegenüber gehen geht gemacht gewesen gibt gross grosse grossen gut
hab habe haben hat hatte hatten heute hier hin hinter
ich ihm ihn ihnen ihr ihre ihrem ihren ihrer ihres immer in indem ins ist
jede jedem jeden jeder jedes jetzt
kann kaum kein keine keinen können könnte
lange lässt lassen letzte letzten
machen macht mal man manche mehr mein meine mit muss müssen musste
nach nachdem neben neu neue neuen nicht nichts noch nun nur
ob oder ohne
schon sehr sein seine seinem seinen seiner seit selbst sich sie sind so solche soll sollen
sondern sonst sowie später stark steht
tun
über übrigens um und uns unser unsere unter
viel viele vielen vom von vor während
war waren warum was weg weil weiter weitere weiteren welche wenn wer werden wird wirklich wie
wieder will wir wo wollen worden wurde wurden
zehn zeit zu zum zur zurück zusammen zwar zwei zwischen
sagt sagte sagten kommt kommen sieht
prozent millionen milliarden euro
`;

const EN_STOPWORDS = `
about above after again against all almost along already also although always among and another
any anything are around as at
back be because been before being below best better between both but by
came can cannot come comes could
did do does doing done down due during
each early either else enough even ever every
far few first for found from further
gave get gets getting give given go goes going gone got
had has have having he her here hers herself him himself his how however
if in into is it its itself
just
keep kept know known
last late later least less let like likely long look looking
made make makes making many may maybe me might more most much must my
near need needs never new next no nor not now
of off often on once one only onto or other others our out over own
part per perhaps put
quite
rather really right
said same saw say says see seen set several shall she should since so some something soon still
such
take taken than that the their them themselves then there these they thing things this those
though three through thus time to today together too took toward two
under until up upon us use used using
very
want was way we well went were what when where whether which while who whom whose why will with
within without would
year years yet you your
told according reported
percent million billion
`;

/**
 * Folded at construction, so these lists can be written as ordinary German and
 * English words. `fold` is the single source of truth for normalisation —
 * hand-transliterating umlauts here would silently stop "Türkei" matching.
 */
export const STOPWORDS = new Set(
  `${DE_STOPWORDS} ${EN_STOPWORDS}`
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map(fold),
);

/**
 * Cross-language entity bridge.
 *
 * This is what lets a tagesschau piece and a BBC piece about the same event land
 * in one story. Each entry maps surface forms (already folded to ASCII) onto a
 * single canonical token. Multi-word keys are substituted before tokenisation.
 */
const ALIAS_GROUPS: [canonical: string, forms: string[]][] = [
  // People
  ['zelensky', ['selenskyj', 'selenskyi', 'zelenskyy', 'zelenskiy']],
  ['putin', ['wladimir putin', 'vladimir putin']],
  ['trump', ['donald trump']],
  ['merz', ['friedrich merz']],
  ['netanyahu', ['netanjahu', 'benjamin netanyahu', 'benjamin netanjahu']],
  ['macron', ['emmanuel macron']],
  ['starmer', ['keir starmer']],
  ['erdogan', ['recep tayyip erdogan']],
  ['vonderleyen', ['von der leyen', 'ursula von der leyen']],

  // Countries and regions
  ['russia', ['russland', 'russische', 'russischen', 'russischer', 'russisch']],
  ['ukraine', ['ukrainische', 'ukrainischen', 'ukrainisch']],
  ['germany', ['deutschland', 'deutsche', 'deutschen', 'deutscher', 'german', 'bundesrepublik']],
  ['usa', ['vereinigte staaten', 'united states', 'america', 'amerika', 'amerikanische',
    'amerikanischen', 'american', 'washington']],
  ['china', ['chinesische', 'chinesischen', 'chinese', 'peking', 'beijing']],
  ['israel', ['israelische', 'israelischen', 'israelischer', 'israeli']],
  ['iran', ['iranische', 'iranischen', 'iranian', 'teheran', 'tehran']],
  ['britain', ['grossbritannien', 'united kingdom', 'britische', 'britischen', 'british', 'london']],
  ['france', ['frankreich', 'französische', 'französischen', 'french', 'paris']],
  ['turkey', ['Türkei', 'türkische', 'türkischen', 'turkish', 'ankara']],
  ['poland', ['polen', 'polnische', 'polnischen', 'polish', 'warschau', 'warsaw']],
  ['india', ['indien', 'indische', 'indischen', 'indian']],
  ['japan', ['japanische', 'japanischen', 'japanese', 'tokio', 'tokyo']],
  ['syria', ['syrien', 'syrische', 'syrischen', 'syrian']],
  ['yemen', ['jemen', 'jemenitische', 'yemeni']],
  ['afghanistan', ['afghanische', 'afghan']],
  ['northkorea', ['nordkorea', 'north korea', 'Pjöngjang', 'pyongyang']],
  ['southkorea', ['Südkorea', 'south korea', 'seoul']],
  ['westbank', ['westjordanland', 'west bank']],
  ['gaza', ['gazastreifen', 'gaza strip']],
  ['brussels', ['Brüssel']],
  ['moscow', ['moskau']],

  // Institutions
  ['un', ['vereinte nationen', 'united nations', 'uno', 'generalversammlung',
    'general assembly', 'sicherheitsrat', 'security council']],
  ['eu', ['Europäische Union', 'european union', 'eu-kommission', 'european commission',
    'eu-gipfel', 'Europäischen Union']],
  ['nato', ['north atlantic treaty organization']],
  ['ecb', ['ezb', 'Europäische Zentralbank', 'european central bank']],
  ['fed', ['federal reserve', 'us-notenbank']],
  ['who', ['Weltgesundheitsorganisation', 'world health organization']],
  ['imf', ['iwf', 'Internationaler Währungsfonds', 'international monetary fund']],

  // Recurring events and concepts
  ['ceasefire', ['waffenruhe', 'waffenstillstand', 'feuerpause', 'truce']],
  ['war', ['krieg', 'kriege']],
  ['election', ['wahl', 'wahlen', 'landtagswahl', 'bundestagswahl', 'urnengang']],
  ['sanctions', ['sanktionen', 'strafmassnahmen']],
  ['inflation', ['teuerung', 'preisanstieg']],
  ['interestrate', ['leitzins', 'leitzinsen', 'zinssatz', 'interest rate', 'interest rates']],
  ['recession', ['rezession', 'abschwung']],
  ['earthquake', ['erdbeben', 'beben']],
  ['typhoon', ['taifun', 'hurrikan', 'hurricane', 'wirbelsturm']],
  ['flood', ['Überschwemmung', 'hochwasser']],
  ['wildfire', ['waldbrand', 'Waldbrände']],
  ['climate', ['klima', 'klimawandel', 'klimakrise', 'climate change', 'global warming',
    'Erderwärmung']],
  ['ai', ['künstliche Intelligenz', 'artificial intelligence', 'machine learning',
    'künstlicher Intelligenz']],
  ['refugees', ['Geflüchtete', 'Flüchtlinge', 'migranten', 'migrants']],
  ['strike', ['streik', 'streiks', 'arbeitskampf', 'walkout']],
  ['protest', ['proteste', 'demonstration', 'demonstrationen', 'kundgebung']],
  ['tariffs', ['Zölle', 'Strafzölle', 'tariff']],
  ['summit', ['gipfel', 'gipfeltreffen']],
  ['coalition', ['koalition', 'regierungskoalition']],
  ['chancellor', ['kanzler', 'bundeskanzler']],
  ['government', ['regierung', 'bundesregierung']],
  ['parliament', ['parlament']],
  ['court', ['gericht', 'gerichtshof', 'bundesverfassungsgericht', 'tribunal']],
  ['investigation', ['ermittlungen', 'untersuchung', 'ermittlung']],
  ['attack', ['angriff', 'anschlag', 'angriffe', 'airstrike', 'luftangriff']],
  ['drone', ['drohne', 'drohnen']],
  ['nuclear', ['atomprogramm', 'nuklear', 'atomwaffen', 'kernkraft']],
  ['energy', ['energie', 'energiekrise', 'energieversorgung']],
  ['deal', ['abkommen', 'vereinbarung', 'agreement', 'accord']],
  ['talks', ['Gespräche', 'verhandlungen', 'negotiations']],
  ['budget', ['haushalt', 'bundeshaushalt']],
  ['debt', ['schulden', 'staatsschulden']],
  ['military', ['Militär', 'armee', 'Streitkräfte', 'troops', 'soldaten']],
  ['weapons', ['waffen', 'Rüstung']],
  ['healthcare', ['gesundheitswesen', 'gesundheitssystem']],
  ['vaccine', ['impfstoff', 'impfung']],
  ['study', ['studie', 'forschung', 'research']],
  ['spacecraft', ['raumsonde', 'raumfahrzeug', 'raumschiff']],
  ['satellite', ['satellit', 'satelliten']],

  // Event verbs and nouns that recur in breaking news, where DE and EN wording
  // otherwise shares no token at all.
  ['crash', ['absturz', 'abgestürzt', 'abgestürzte', 'flugzeugabsturz', 'crashes',
    'crashed', 'verunglückt']],
  ['aircraft', ['flugzeug', 'Militärflugzeug', 'Militärjet', 'kampfjet', 'fighter jet',
    'warplane']],
  ['airbase', ['air base', 'Luftwaffenstützpunkt', 'fliegerhorst', 'Luftwaffenbasis']],
  ['shooting', ['Schüsse', 'schiesserei', 'schussattacke']],
  ['injured', ['verletzt', 'verletzte', 'wounded']],
  ['killed', ['getötet', 'ums leben', 'toten', 'todesopfer']],
  ['arrested', ['festgenommen', 'verhaftet', 'detained']],
  ['convicted', ['verurteilt', 'schuldig', 'guilty']],
  ['sentence', ['haft', 'haftstrafe', 'Gefängnis', 'jailed']],
  ['resign', ['Rücktritt', 'zurücktreten', 'resigns', 'resigned', 'steps down']],
  ['signed', ['unterzeichnet', 'unterzeichnen', 'besiegeln', 'besiegelt']],
  ['greenland', ['Grönland']],
  ['denmark', ['Dänemark', 'dänische', 'dänischen', 'danish', 'kopenhagen']],
  ['overdose', ['Überdosis']],
  ['explosives', ['sprengstoff']],
  ['investor', ['investoren']],
];

/** Single-word surface form to canonical token. */
export const ALIAS_WORD = new Map<string, string>();
/** Multi-word surface form to canonical token, applied before tokenisation. */
export const ALIAS_PHRASES: [RegExp, string][] = [];

for (const [canonical, forms] of ALIAS_GROUPS) {
  ALIAS_WORD.set(fold(canonical), canonical);
  for (const raw of forms) {
    const form = fold(raw);
    if (form.includes(' ')) {
      ALIAS_PHRASES.push([
        new RegExp(`\\b${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'),
        canonical,
      ]);
    } else {
      ALIAS_WORD.set(form, canonical);
    }
  }
}

// Longest phrases first, so a longer name is not half-consumed by a shorter one.
ALIAS_PHRASES.sort((a, b) => b[0].source.length - a[0].source.length);

/**
 * Canonical roots worth digging out of a German compound, since "Ukrainehilfen"
 * and "Klimakonferenz" would otherwise share no token with "Ukraine" or "climate".
 * Longest first so the most specific root wins.
 */
export const COMPOUND_ROOTS: { root: string; canonical: string }[] = [...ALIAS_WORD.entries()]
  .filter(([form]) => form.length >= 5 && !form.includes(' '))
  .map(([root, canonical]) => ({ root, canonical }))
  .sort((a, b) => b.root.length - a.root.length);

/**
 * Reverse index: every folded surface form maps to all the forms that share its
 * canonical token. Search uses it so typing "Zelensky" also finds German
 * articles that spell it "Selenskyj", and "ceasefire" finds "Waffenruhe".
 */
export const ALIAS_EXPANSIONS = new Map<string, string[]>();
{
  const byCanonical = new Map<string, Set<string>>();
  for (const [form, canonical] of ALIAS_WORD) {
    let group = byCanonical.get(canonical);
    if (!group) {
      group = new Set<string>();
      byCanonical.set(canonical, group);
    }
    group.add(form);
  }
  // Multi-word forms are matched as phrases, so they belong in the group too.
  for (const [rx, canonical] of ALIAS_PHRASES) {
    const phrase = rx.source.replace(/\\b/g, '').replace(/\\/g, '');
    byCanonical.get(canonical)?.add(phrase);
  }
  for (const [, group] of byCanonical) {
    const forms = [...group];
    for (const form of forms) ALIAS_EXPANSIONS.set(form, forms);
  }
}
