/* ============================================================
   全量重建 PAPER_DATA：从 PDF 提取 en + 翻译 zh
   每条论文都必须有：title, journal, authors, abstract, toc, source
   ============================================================ */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PAPERS_DIR = join(ROOT, 'assets', 'papers', 'pdf');
const TOC_DIR = join(ROOT, 'assets', 'papers', 'toc');
const SITE_DATA = join(ROOT, 'js', 'data', 'site-data.js');

const tocFiles = new Set(readdirSync(TOC_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f)));
const pdfFiles = readdirSync(PAPERS_DIR).filter(f => f.endsWith('.pdf')).sort();

// ---- 期刊名中英对照 ----
const J_ZH = {
  'J. Am. Chem. Soc.': '美国化学会志',
  'Angew. Chem. Int. Ed.': '德国应用化学国际版',
  'Angew. Chem.': '德国应用化学',
  'Chem. Sci.': '化学科学',
  'Nano Lett.': '纳米快报',
  'Chem. Commun.': '化学通讯',
  'CCS Chem.': '中国化学会化学',
  'Chem. Eur. J.': '欧洲化学',
  'Inorg. Chem.': '无机化学',
  'Organometallics': '有机金属化学',
  'Macromolecules': '大分子',
  'Polym. Chem.': '高分子化学',
  'Dalton Trans.': '道尔顿学报',
  'Nat. Commun.': '自然通讯',
  'ACS Cent. Sci.': 'ACS中心科学',
  'ACS Appl. Mater.': 'ACS应用材料',
  'J. Mater. Chem.': '材料化学杂志',
  'Chin. J. Chem.': '中国化学',
  'Chin. J. Polym. Sci.': '中国高分子科学',
  'Eur. J. Org. Chem.': '欧洲有机化学',
  'Sci. China Chem.': '中国科学：化学',
  'Chem. Synth': '化学合成',
  'Commun. Chem.': '通讯化学',
  'Chemical Engineering Journal': '化学工程杂志',
  'Macromol. Rapid Commun.': '大分子快速通讯',
  'Small': 'Small',
  'Adv. Mater.': '先进材料',
  'Adv. Opt. Mater.': '先进光学材料',
  'Cell Rep. Phys. Sci.': '细胞报告物理科学',
  'Aggregate': '聚集',
};

function journalZh(en) {
  if (!en) return '';
  for (const [k, v] of Object.entries(J_ZH)) {
    if (en.includes(k)) return `${v} (${k})`;
  }
  return en;
}

// ---- PDF 提取逻辑 ----
function extractPaper(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 15);
  const info = { title: '', authors: '', journal: '', abstract: '', doi: '', year: '' };

  // DOI
  const doiM = text.match(/(?:DOI|doi)[:\s]*(10\.\d{4,}\/\S+)/i);
  if (doiM) info.doi = 'https://doi.org/' + doiM[1].replace(/[.,;)\]]+$/, '');

  // Year
  const yrM = text.match(/(?:Published|Received|Accepted|Online)[^2]*(20\d{2})/i) || text.match(/20\d{2}/);
  if (yrM) info.year = yrM[1];

  // Journal
  const J_PATTERNS = [
    /(J\.\s*Am\.\s*Chem\.\s*Soc\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Angew\.\s*Chem\.\s*Int\.\s*Ed\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Chem\.\s*Sci\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Nano\s*Lett\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(CCS\s*Chem\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Chem\.\s*Commun[.,\s]+\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Chem\.\s*Eur\.\s*J\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Inorg\.\s*Chem\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Macromol\.\s*Rapid\s*Commun\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Chin\.\s*J\.\s*Chem\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Chin\.\s*J\.\s*Polym\.\s*Sci\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Eur\.\s*J\.\s*Org\.\s*Chem\.\s*\d{4}[,\s]*\w+)/i,
    /(Sci\.\s*China\s*Chem\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Commun\.\s*Chem\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Chemical Engineering Journal\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Chem\.\s*Synth\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Macromolecules\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Organometallics\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Dalton\s*Trans\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Polym\.\s*Chem\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Nat\.\s*Commun\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(ACS\s*Cent\.\s*Sci\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(ACS\s*Appl\.\s*Mater\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(J\.\s*Mater\.\s*Chem\.\s*[A-C]?\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Adv\.\s*Mater\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Adv\.\s*Opt\.\s*Mater\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
    /(Adv\.\s*Funct\.\s*Mater\.\s*\d{4}[,\s]*\d+[,\s]*\d+[-–]\d+)/i,
  ];
  for (const p of J_PATTERNS) {
    const m = text.match(p);
    if (m) { info.journal = m[1].replace(/\s+/g, ' ').trim(); break; }
  }

  // DOI-based journal fallback
  if (!info.journal && info.doi) {
    const d = info.doi;
    if (/10\.1021\/ja/i.test(d)) info.journal = 'J. Am. Chem. Soc.';
    else if (/10\.1002\/anie/i.test(d)) info.journal = 'Angew. Chem. Int. Ed.';
    else if (/10\.1039\/[cd]\dsc/i.test(d)) info.journal = 'Chem. Sci.';
    else if (/10\.1039\/[cd]\dcc/i.test(d)) info.journal = 'Chem. Commun.';
    else if (/10\.1021\/acs\.nanolett/i.test(d)) info.journal = 'Nano Lett.';
    else if (/10\.1002\/chem/i.test(d)) info.journal = 'Chem. Eur. J.';
    else if (/10\.1039\/[cd]\dtb/i.test(d)) info.journal = 'Dalton Trans.';
    else if (/10\.1002\/marc/i.test(d)) info.journal = 'Macromol. Rapid Commun.';
    else if (/10\.1002\/smll/i.test(d)) info.journal = 'Small';
    else if (/10\.1002\/adma/i.test(d)) info.journal = 'Adv. Mater.';
    else if (/10\.1002\/adom/i.test(d)) info.journal = 'Adv. Opt. Mater.';
    else if (/10\.1002\/ejoc/i.test(d)) info.journal = 'Eur. J. Org. Chem.';
    else if (/10\.1016\/j\.xcrp/i.test(d)) info.journal = 'Cell Rep. Phys. Sci.';
    else if (/10\.1002\/agt\d/i.test(d)) info.journal = 'Aggregate';
    else if (/10\.1007\/s10118/i.test(d)) info.journal = 'Chin. J. Polym. Sci.';
    else if (/10\.1002\/cjoc/i.test(d)) info.journal = 'Chin. J. Chem.';
    else if (/10\.1007\/s11426/i.test(d)) info.journal = 'Sci. China Chem.';
    else if (/10\.1038\/s42004/i.test(d)) info.journal = 'Commun. Chem.';
    else if (/10\.20517\/cs/i.test(d)) info.journal = 'Chem. Synth';
  }

  // Title — skip header cruft
  const skipRe = /^(Published|How to|Received|Accepted|Cite|For submission|https?:|doi\.org|All publication|have been|www\.|Edge Article|REVIEW|RESEARCH ARTICLE|Research Article|rsc\.li|Licence|View Article|Downloaded|ARTICLE|Communication|Full Paper|Electronic|Supporting|Supplementary|See https|Angewandte|Chemie|ChemComm|Dalton|Chemical Engineering|Chemical Science|Nanozymes|German Edition|International Edition|\*S Supporting|\d+$|Vol\.|© |Correspondence|E-mail|KEYWORDS|Current address)/i;

  for (const line of lines) {
    if (line.length < 30) continue;
    if (skipRe.test(line)) continue;
    const alpha = (line.match(/[a-zA-Z]/g) || []).length / line.length;
    if (alpha > 0.4) { info.title = line; break; }
  }

  // Authors — next substantive line after title
  let foundTitle = false;
  for (const line of lines) {
    if (foundTitle) {
      if (line.length > 20 && /[,;]/.test(line) && !skipRe.test(line)) {
        info.authors = line; break;
      }
    }
    if (line === info.title) foundTitle = true;
  }

  // Abstract
  const absM = text.match(/ABSTRACT[:\s]*\n([\s\S]{100,800}?)(?=\n\s*(?:INTRODUCTION|\*S Supporting|KEYWORDS|\n\s*\n\s*[A-Z]))/i)
    || text.match(/Abstract[:\s]*\n([\s\S]{100,800}?)(?=\n\s*(?:Introduction|Results|KEYWORDS))/i);
  if (absM) {
    info.abstract = absM[1].replace(/\s+/g, ' ').trim().substring(0, 600);
  } else {
    // Fallback: first body paragraph
    for (const line of lines) {
      if (line.length > 120 && line.includes('.') && !skipRe.test(line)) {
        info.abstract = line.substring(0, 600); break;
      }
    }
  }

  // Clean authors
  info.authors = info.authors.replace(/[;*#,�]+$/, '').replace(/[,;*#�]{2,}/g, ',').replace(/\s+/g, ' ').trim();
  if (/^(Cite this|Published|Received|and \d|Rhombus)/i.test(info.authors)) info.authors = '';

  return info;
}

// ---- 标题（中英对照，59 条） ----
const EN_TITLES = {
  'paper-01': 'From Trigonal Bipyramidal to Platonic Solids: Self-Assembly and Self-Sorting Study of Terpyridine-Based 3D Architectures',
  'paper-02': 'Self-assembly of giant supramolecular cubes with terpyridine ligands as vertices and metals on edges',
  'paper-03': 'Hexagon Wreaths: Self-Assembly of Discrete Supramolecular Fractal Architectures Using Multitopic Terpyridine Ligands',
  'paper-04': 'A Conductive Self-Healing Hybrid Gel Enabled by Metal-Ligand Supramolecule and Nanostructured Conductive Polymer',
  'paper-05': 'From Ring-in-Ring to Sphere-in-Sphere: Self-Assembly of Discrete 2D and 3D Architectures with Increasing Stability',
  'paper-06': 'Self-Assembly of Concentric Hexagons and Hierarchical Self-Assembly of Supramolecular Metal-Organic Nanoribbons at the Solid/Liquid Interface',
  'paper-07': 'Supersnowflakes: Stepwise Self-Assembly and Dynamic Exchange of Rhombus Star-Shaped Supramolecules',
  'paper-08': 'Stepwise Self-Assembly and Dynamic Exchange of Supramolecular Nanocages Based on Terpyridine Building Blocks',
  'paper-09': 'Self-Assembly of Supramolecular Fractals from Generation 1 to 5',
  'paper-10': 'Self-Assembly of Tetrameric and Hexameric Terpyridine-Based Macrocycles Using Cd(II)',
  'paper-11': 'Stepwise Self-Assembly and Dynamic Exchange of Supramolecular Nanocages Based on Terpyridine Building Blocks',
  'paper-12': 'Tetraphenylethylene-Based Emissive Supramolecular Metallacages Assembled by Terpyridine Ligands',
  'paper-13': 'Self-Assembly of Porphyrin-Containing Metalla-Assemblies and Cancer Photodynamic Therapy',
  'paper-14': 'From Dimeric to Octameric Metallo-Supramolecular Macrocycles Based on Sterically Congested Ligand-assisted Self-Assembly with Zn(II), Cd(II), and Fe(II)',
  'paper-15': 'Self-Assembly Methods for Recently Reported Discrete Supramolecular Structures Based on Terpyridine',
  'paper-16': 'Self-Assembly of Metallo-Supramolecules with Dissymmetrical Ligands and Characterization',
  'paper-17': 'Supramolecular Chemistry: Design and Assembly of Terpyridine-Based Fractal Structures',
  'paper-18': 'From Mechanically Interlocked Structures to Host-Guest Chemistry Based on Twisted Ligands',
  'paper-19': 'Designing narcissistic self-sorting terpyridine moieties with high coordination selectivity',
  'paper-20': 'Exploring the Nanomechanical Properties of a Coordination-bond Based Supramolecular Polymer',
  'paper-21': 'Porphyrin-Containing Metallacage with Precise Active Sites and Super Long-Term Stability',
  'paper-22': 'Construction of metallo-triangles with cis-TPE motifs and fluorescence properties',
  'paper-23': 'Chemical Synthesis: Design and Functional Study of Supramolecular Structures',
  'paper-24': 'Multi-Decker Emissive Supramolecular Architectures Based on Shape-Complementary Building Blocks',
  'paper-25': 'Coordination-Driven Terpyridine-Based Twisted Prisms with Tunable Emissions and Chiroptical Properties',
  'paper-26': 'Porous Assembly of Metallo-Supramolecule and Polyoxometalate via Ionic Complexation',
  'paper-27': 'Discrete Platinum(II) Metallacycles with Inner- and Outer-Modified 9,10-Distyrylanthracene',
  'paper-28': 'Design and Self-Assembly of Macrocycles with Metals at the Corners Based on Dissymmetrical Ligands',
  'paper-29': 'Shape-Dependent Complementary Ditopic Terpyridine Pair with Two Levels of Self-Recognition',
  'paper-30': 'Coordination-Induced Conformational Control Enables Highly Luminescent Metallo-Supramolecular Systems',
  'paper-31': 'Construction of outward-everted metal-organic cages induced by steric hindrance groups',
  'paper-32': 'Nitrogen Atom Induced Contrast Effect on the Mechanofluorochromic Characteristics of Anthracene-Based Compounds',
  'paper-33': 'Construction of 1,3,5-Triazine-Based Prisms and Their Enhanced Solid-State Emission',
  'paper-34': 'Metal-Organic Dimerization of Dissymmetrical Ligands toward Customized Through-Space Charge Transfer',
  'paper-35': 'Hourglass-Shaped Nanocages with Concaved Structures Based on Selective Self-Complementary Assembly',
  'paper-36': 'A Highly Luminescent Metallo-Supramolecular Radical Cage',
  'paper-37': 'Precise Modulation of Intramolecular Aggregation-induced Electrochemiluminescence',
  'paper-38': 'Dislocated Bilayer MOF Enables High-Selectivity Photocatalytic Reduction of CO2',
  'paper-39': 'Stacking-Angle-Manipulated Emission (SAME) in Anthracene-Based Figure-Eight Metallo-Supramolecules',
  'paper-40': 'Supramolecular Structure Enabled Photo-Responsive Charge Transport in Porphyrin-Fullerene Systems',
  'paper-41': 'Sandwich-like Heterochromophore Metallo-Supramolecules Based on Dense Chromophore Arrangement',
  'paper-42': 'Synthesis of Anthracene-Based Mechanofluorochromic Molecules and Their Differential Mechanochromic Effects Triggered by Nitrogen Atoms',
  'paper-43': 'Stereoisomers of metal-organic dimers induced by the steric constraint of dissymmetrical ligands',
  'paper-44': 'Tailoring multi-dimensional hierarchical self-assembly of metallacages through balancing non-covalent interactions',
  'paper-45': 'Achieving Long-Lived Visible-Light-Excited Phosphorescence Through Orchestrating Intramolecular Aggregation',
  'paper-46': 'Stacking-Angle-Manipulated Emission (SAME) in Anthracene-Based Figure-Eight Metallo-Supramolecules',
  'paper-47': 'Configurational control of low-symmetry heteroleptic metal-organic cages with asymmetric ligands',
  'paper-48': 'Tailoring multi-dimensional hierarchical self-assembly of metallacages through balancing non-covalent interactions',
  'paper-49': 'Isomeric decker metallo-supramolecules with tunable luminescence and chiroptical properties',
  'paper-50': 'Novel metallo-supramolecular architectures based on side-pyridine-modified terpyridines: design, self-assembly, and properties',
  'paper-51': 'Construction and Function of Low-Symmetry Metallo-Supramolecules',
  'paper-52': 'Design and Functional Study of Terpyridine-Based Supramolecular Structures',
  'paper-53': 'Supramolecular Structure Enabled Photo-Responsive Charge Transport in Porphyrin-Fullerene Systems',
  'paper-54': 'Pathway Engineering in Pd-Based Supramolecular Cage Synthesis via Inner-Outer Steric Strategy',
  'paper-55': 'Length Ratio-Driven Configurational Modulation of Heteroleptic Pd6L6L\'6 Cages',
  'paper-57': 'Turn-On Metal Ion Responsive Behavior Enabled by Coordination-Driven Multicomponent Self-Assembly',
  'paper-58': 'Turn-On Metal Ion Responsive Behavior Enabled by Coordination-Driven Multicomponent Self-Assembly',
  'paper-59': 'Decker Supramolecular Architecture-Derived Near-Infrared Luminescent Materials for Bioimaging',
  'paper-60': 'Through-Space Charge Transfer Complexes Based on Terpyridine Bi-Functionalization',
};

const ZH_TITLES = {
  'paper-01': '从三角双锥到柏拉图立体：基于三联吡啶的三维结构的自组装与自分选研究',
  'paper-02': '以三联吡啶配体为顶点、金属为棱边的巨型超分子立方体的自组装',
  'paper-03': '六边形花环：利用多位点三联吡啶配体自组装离散超分子分形结构',
  'paper-04': '金属-配体超分子与纳米结构导电聚合物协同实现导电自修复杂化凝胶',
  'paper-05': '从环中环到球中球：稳定性递增的离散二维和三维结构的自组装',
  'paper-06': '同心六边形的自组装及超分子金属-有机纳米带在固/液界面的分级自组装',
  'paper-07': '超级雪花：基于三联吡啶的分步骤自组装与动态交换',
  'paper-08': '基于三联吡啶的超分子纳米笼的分步骤自组装与动态交换',
  'paper-09': '从第一代到第五代超分子分形的自组装',
  'paper-10': '利用Cd(II)离子自组装基于三联吡啶的四聚和六聚大环',
  'paper-11': '基于三联吡啶配体的分步骤自组装与动态交换',
  'paper-12': '基于三联吡啶的四苯乙烯发光超分子金属笼的组装',
  'paper-13': '含卟啉金属组装体的自组装及其癌症光动力治疗研究',
  'paper-14': '基于空间位阻效应从二聚到八聚金属-超分子大环的构建',
  'paper-15': '近期报道的离散超分子结构的自组装方法综述',
  'paper-16': '基于不对称配体的金属-超分子自组装及其表征',
  'paper-17': '超分子化学：三联吡啶基分形结构的设计与组装',
  'paper-18': '从机械互锁结构到基于扭曲配体的主客体化学',
  'paper-19': '设计高配位选择性的自分选三联吡啶模块',
  'paper-20': '探索基于配位键的超分子聚合物的纳米力学性能',
  'paper-21': '具有精确活性位点和超长稳定性的卟啉金属笼',
  'paper-22': '含顺式四苯乙烯基序的金属三角形的构建及荧光性质',
  'paper-23': '化学合成：超分子结构的设计与功能研究进展',
  'paper-24': '基于形状互补的多层发光超分子结构',
  'paper-25': '配位驱动的三联吡啶基扭曲棱柱：可调发射与手性光学性质',
  'paper-26': '金属-超分子与多金属氧酸盐通过离子络合的多孔组装',
  'paper-27': '内外修饰的9,10-二苯乙烯基蒽的离散铂(II)金属环',
  'paper-28': '基于不对称配体的金属顶点大环的设计与自组装',
  'paper-29': '形状依赖的互补双三联吡啶对的两级自识别',
  'paper-30': '配位诱导构象控制实现高发光金属-超分子体系',
  'paper-31': '基于空间位阻效应构建外翻型金属-有机笼',
  'paper-32': '氮原子诱导的蒽基力致荧光变色分子的对比效应',
  'paper-33': '1,3,5-三嗪基棱柱的构建及其增强的固态发光性能',
  'paper-34': '不对称配体的金属-有机二聚化实现定制化空间电荷转移',
  'paper-35': '基于选择性自补组装的沙漏形凹面纳米笼',
  'paper-36': '高发光金属-超分子自由基笼',
  'paper-37': '分子内聚集诱导电化学发光的精确调控',
  'paper-38': '位错双层MOF实现高选择性光催化CO₂还原',
  'paper-39': '堆叠角度调控的蒽基8字形金属-超分子的发射性质',
  'paper-40': '超分子结构实现光响应电荷传输',
  'paper-41': '基于密集发色团的三明治型异发色团金属-超分子',
  'paper-42': '蒽基力致荧光变色分子的合成及氮原子触发的差异力致变色效应',
  'paper-43': '不对称配体空间约束诱导的金属-有机二聚体的立体异构体',
  'paper-44': '通过协调非共价相互作用实现金属笼的多维分级自组装',
  'paper-45': '通过调控分子内聚集实现长寿命可见光激发磷光',
  'paper-46': '蒽基8字形金属-超分子中堆叠角度调控的发射',
  'paper-47': '不对称配体构型调控的低对称性杂配金属-有机笼',
  'paper-48': '通过平衡非共价相互作用定制金属笼的多维分级自组装',
  'paper-49': '具有可调发光和手性光学性质的同分异构多层金属-超分子',
  'paper-50': '基于侧链吡啶修饰三联吡啶的新型金属-超分子结构：设计、自组装与性质',
  'paper-51': '低对称性金属-超分子的构建与功能',
  'paper-52': '基于三联吡啶的超分子结构的设计与功能研究',
  'paper-53': '超分子结构实现卟啉-富勒烯体系中的光响应电荷传输',
  'paper-54': '通过内外空间位阻策略实现钯基超分子笼合成的路径工程',
  'paper-55': '长度比驱动的杂配Pd₆L₆L\'₆笼的构型调控',
  'paper-57': '配位驱动的多组分自组装实现金属离子响应行为',
  'paper-58': '配位驱动的多组分自组装实现开启型金属离子响应',
  'paper-59': '多层超分子结构衍生的近红外发光材料用于生物成像',
  'paper-60': '基于三联吡啶双功能化的空间电荷转移配合物',
};

// ---- Main ----
console.log(`Processing ${pdfFiles.length} PDFs...\n`);

const papers = [];
let ok = 0, fail = 0;

for (const pdf of pdfFiles) {
  const id = pdf.replace('.pdf', '');
  const pdfPath = join(PAPERS_DIR, pdf);
  const tocPath = tocFiles.has(id + '.jpg') ? `./assets/papers/toc/${id}.jpg` : '';

  let text = '';
  try {
    text = execSync(`pdftotext -layout "${pdfPath}" -`, {
      encoding: 'utf-8', timeout: 10000, maxBuffer: 2 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch (e) {
    console.log(`  FAIL ${id}: cannot read PDF`);
    fail++;
    // Add placeholder
    papers.push({
      id, date: '', toc: tocPath, pdf: `./assets/papers/pdf/${pdf}`,
      zh: { title: ZH_TITLES[id] || '', journal: '', authors: '', abstract: '' },
      en: { title: '', journal: '', authors: '', abstract: '' },
      source: '', tags: []
    });
    continue;
  }

  const info = extractPaper(text);
  const enTitle = EN_TITLES[id] || info.title || '';
  const zhTitle = ZH_TITLES[id] || '';
  const enJournal = info.journal || '';
  const zhJournal = journalZh(enJournal);

  papers.push({
    id,
    date: info.year || '',
    toc: tocPath,
    pdf: `./assets/papers/pdf/${pdf}`,
    zh: {
      title: zhTitle,
      journal: zhJournal,
      authors: info.authors || '',
      abstract: ''
    },
    en: {
      title: enTitle,
      journal: enJournal,
      authors: info.authors || '',
      abstract: info.abstract || ''
    },
    source: info.doi || '',
    tags: []
  });

  ok++;
  console.log(`  ${enTitle ? '✓' : '✗'} ${id}: ${enTitle.substring(0, 70)}`);
}

// Sort by id
papers.sort((a, b) => {
  const an = parseInt(a.id.split('-')[1]), bn = parseInt(b.id.split('-')[1]);
  return an - bn;
});

// ---- Read original site-data.js and replace PAPER_DATA ----
const content = readFileSync(SITE_DATA, 'utf-8');
const start = content.indexOf('const PAPER_DATA = [');
let end = start;
const afterPAPER = content.substring(start + 'const PAPER_DATA = ['.length);
let bracketDepth = 0, inString = false, stringChar = '';
for (let i = 0; i < afterPAPER.length; i++) {
  const ch = afterPAPER[i];
  if (inString) {
    if (ch === '\\') { i++; continue; }
    if (ch === stringChar) { inString = false; }
    continue;
  }
  if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
  if (ch === '[') bracketDepth++;
  else if (ch === ']') {
    if (bracketDepth === 0) { end = start + 'const PAPER_DATA = ['.length + i + 1; break; }
    bracketDepth--;
  }
}

let out = 'const PAPER_DATA = [\n';
for (const p of papers) {
  const zh = p.zh, en = p.en;
  out += '  {\n';
  out += `    id: "${p.id}", date: "${p.date}", toc: "${p.toc}", pdf: "${p.pdf}",\n`;
  out += `    zh: { title: ${JSON.stringify(zh.title)}, journal: ${JSON.stringify(zh.journal)}, authors: ${JSON.stringify(zh.authors)}, abstract: ${JSON.stringify(zh.abstract)} },\n`;
  out += `    en: { title: ${JSON.stringify(en.title)}, journal: ${JSON.stringify(en.journal)}, authors: ${JSON.stringify(en.authors)}, abstract: ${JSON.stringify(en.abstract)} },\n`;
  out += `    source: ${JSON.stringify(p.source)}, tags: ${JSON.stringify(p.tags)}\n`;
  out += '  },\n';
}
out += '];\n';

const newContent = content.substring(0, start) + out + content.substring(end + 1);
writeFileSync(SITE_DATA, newContent, 'utf-8');

// ---- Stats ----
let enTitle=0, zhTitle=0, enJrn=0, zhJrn=0, enAbs=0, zhAbs=0, toc=0, src=0;
for (const p of papers) {
  if (p.en.title.length > 10) enTitle++;
  if (p.zh.title.length > 5) zhTitle++;
  if (p.en.journal.length > 3) enJrn++;
  if (p.zh.journal.length > 3) zhJrn++;
  if (p.en.abstract.length > 10) enAbs++;
  if (p.zh.abstract.length > 10) zhAbs++;
  if (p.toc) toc++;
  if (p.source) src++;
}

console.log(`\n=== FINAL STATS ===`);
console.log(`Papers: ${papers.length} | OK: ${ok} | Failed: ${fail}`);
console.log(`en title: ${enTitle}  | zh title: ${zhTitle}`);
console.log(`en journal: ${enJrn} | zh journal: ${zhJrn}`);
console.log(`en abstract: ${enAbs} | zh abstract: ${zhAbs}`);
console.log(`TOC images: ${toc} | DOI links: ${src}`);
console.log(`\nWritten to site-data.js`);
