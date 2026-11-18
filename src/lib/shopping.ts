import { toLab, type PaletteColor } from '@/lib/processing';
import type { Medium } from './plan';

type Rgb = [number, number, number];

/** What to look for in a shop: a thread number, or the pigment printed on paint tubes. */
export interface ShoppingColor extends PaletteColor {
  /** e.g. `DMC 321` for thread, `PB29` for a single-pigment paint; absent for convenience mixes. */
  code?: string;
  shopUrl?: string;
}

const MICHAELS_SEARCH = 'https://www.michaels.com/search?q=';
const shopLink = (query: string) => MICHAELS_SEARCH + encodeURIComponent(query);

/**
 * DMC six-strand embroidery floss, with the screen colours commonly published for each number.
 * Screen colours are approximate, so a match is "the closest DMC", not an exact dye match.
 */
const DMC: [code: string, name: string, rgb: Rgb][] = [
  ['B5200', 'Snow White', [255, 255, 255]], ['Blanc', 'White', [252, 251, 248]], ['Ecru', 'Ecru', [240, 234, 218]],
  ['3865', 'Winter White', [249, 247, 241]], ['712', 'Cream', [255, 251, 239]], ['746', 'Off White', [252, 252, 238]],
  ['3866', 'Mocha Brown UL VY LT', [250, 246, 240]], ['3823', 'Yellow UL Pale', [255, 253, 227]],
  ['310', 'Black', [0, 0, 0]], ['3799', 'Pewter Gray VY DK', [66, 66, 66]], ['413', 'Pewter Gray DK', [86, 86, 86]],
  ['317', 'Pewter Gray', [108, 108, 108]], ['414', 'Steel Gray DK', [140, 140, 140]], ['318', 'Steel Gray LT', [171, 171, 171]],
  ['415', 'Pearl Gray', [211, 211, 214]], ['762', 'Pearl Gray VY LT', [236, 236, 236]], ['535', 'Ash Gray VY LT', [99, 100, 88]],
  ['3072', 'Beaver Gray VY LT', [230, 232, 232]], ['647', 'Beaver Gray MD', [176, 176, 149]], ['646', 'Beaver Gray DK', [135, 141, 128]],
  ['645', 'Beaver Gray VY DK', [110, 101, 92]], ['844', 'Beaver Gray UL DK', [72, 72, 72]],
  ['3371', 'Black Brown', [30, 17, 8]], ['938', 'Coffee Brown UL DK', [54, 31, 14]], ['898', 'Coffee Brown VY DK', [73, 42, 19]],
  ['801', 'Coffee Brown DK', [101, 57, 25]], ['433', 'Brown MD', [122, 69, 31]], ['434', 'Brown LT', [152, 94, 51]],
  ['435', 'Brown VY LT', [184, 119, 72]], ['436', 'Tan', [203, 144, 81]], ['437', 'Tan LT', [228, 187, 142]],
  ['738', 'Tan VY LT', [236, 204, 158]], ['739', 'Tan UL VY LT', [248, 228, 200]],
  ['3862', 'Mocha Beige DK', [138, 110, 78]], ['3863', 'Mocha Beige MD', [164, 131, 92]], ['3864', 'Mocha Beige LT', [203, 182, 156]],
  ['838', 'Beige Brown VY DK', [89, 73, 55]], ['839', 'Beige Brown DK', [103, 85, 65]], ['840', 'Beige Brown MD', [154, 124, 92]],
  ['841', 'Beige Brown LT', [182, 155, 126]], ['842', 'Beige Brown VY LT', [209, 186, 161]], ['543', 'Beige Brown UL VY LT', [242, 227, 206]],
  ['3031', 'Mocha Brown VY DK', [75, 60, 42]], ['3021', 'Brown Gray VY DK', [79, 75, 65]], ['3787', 'Brown Gray DK', [98, 93, 80]],
  ['3022', 'Brown Gray MD', [142, 144, 120]], ['3023', 'Brown Gray LT', [177, 170, 151]], ['3790', 'Beige Gray UL DK', [127, 106, 85]],
  ['3032', 'Mocha Brown MD', [179, 159, 139]], ['3782', 'Mocha Brown LT', [210, 188, 166]], ['3033', 'Mocha Brown VY LT', [227, 216, 204]],
  ['640', 'Beige Gray VY DK', [133, 123, 97]], ['642', 'Beige Gray DK', [164, 152, 120]], ['644', 'Beige Gray MD', [221, 216, 203]],
  ['822', 'Beige Gray LT', [231, 226, 211]], ['610', 'Drab Brown DK', [121, 96, 71]], ['611', 'Drab Brown', [150, 118, 86]],
  ['612', 'Drab Brown LT', [188, 154, 120]], ['167', 'Yellow Beige VY DK', [167, 124, 73]], ['3045', 'Yellow Beige DK', [188, 150, 106]],
  ['3046', 'Yellow Beige MD', [216, 188, 154]], ['3047', 'Yellow Beige LT', [231, 214, 193]],
  ['300', 'Mahogany VY DK', [111, 47, 0]], ['400', 'Mahogany DK', [143, 67, 15]], ['301', 'Mahogany MD', [179, 95, 43]],
  ['3776', 'Mahogany LT', [207, 121, 57]], ['402', 'Mahogany VY LT', [247, 167, 119]], ['919', 'Red Copper', [166, 69, 16]],
  ['920', 'Copper MD', [172, 84, 20]], ['921', 'Copper', [198, 98, 24]], ['922', 'Copper LT', [226, 115, 35]],
  ['975', 'Golden Brown DK', [145, 79, 18]], ['3826', 'Golden Brown', [173, 114, 57]], ['976', 'Golden Brown MD', [194, 129, 66]],
  ['977', 'Golden Brown LT', [220, 156, 86]], ['780', 'Topaz UL VY DK', [148, 99, 26]], ['782', 'Topaz DK', [174, 119, 32]],
  ['783', 'Topaz MD', [206, 145, 36]], ['3829', 'Old Gold VY DK', [169, 130, 4]], ['729', 'Old Gold MD', [208, 165, 62]],
  ['676', 'Old Gold LT', [229, 206, 151]], ['677', 'Old Gold VY LT', [245, 236, 203]], ['3820', 'Straw DK', [223, 182, 95]],
  ['3821', 'Straw', [243, 206, 117]], ['3822', 'Straw LT', [246, 220, 152]],
  ['444', 'Lemon DK', [255, 214, 0]], ['307', 'Lemon', [253, 237, 84]], ['973', 'Canary Bright', [255, 227, 0]],
  ['445', 'Lemon LT', [255, 251, 139]], ['3078', 'Golden Yellow VY LT', [253, 249, 205]], ['727', 'Topaz VY LT', [255, 241, 175]],
  ['726', 'Topaz LT', [253, 215, 85]], ['725', 'Topaz MD LT', [255, 200, 64]], ['743', 'Yellow MD', [254, 211, 118]],
  ['744', 'Yellow Pale', [255, 231, 147]], ['745', 'Yellow LT Pale', [255, 233, 173]],
  ['742', 'Tangerine LT', [255, 191, 87]], ['741', 'Tangerine MD', [255, 163, 43]], ['740', 'Tangerine', [255, 139, 0]],
  ['970', 'Pumpkin LT', [247, 139, 19]], ['971', 'Pumpkin', [246, 127, 0]], ['947', 'Burnt Orange', [255, 123, 77]],
  ['946', 'Burnt Orange MD', [235, 99, 7]], ['900', 'Burnt Orange DK', [209, 88, 7]], ['722', 'Orange Spice LT', [247, 151, 111]],
  ['721', 'Orange Spice MD', [242, 120, 66]], ['720', 'Orange Spice DK', [229, 92, 31]],
  ['3770', 'Tawny VY LT', [255, 238, 227]], ['951', 'Tawny LT', [255, 226, 207]], ['945', 'Tawny', [251, 213, 187]],
  ['950', 'Desert Sand LT', [238, 211, 196]], ['3064', 'Desert Sand', [196, 142, 112]], ['407', 'Desert Sand DK', [187, 129, 97]],
  ['3772', 'Desert Sand VY DK', [160, 108, 80]], ['632', 'Desert Sand UL VY DK', [135, 85, 57]], ['754', 'Peach LT', [247, 203, 191]],
  ['758', 'Terra Cotta VY LT', [238, 170, 155]], ['3778', 'Terra Cotta LT', [217, 137, 120]], ['356', 'Terra Cotta MD', [197, 106, 91]],
  ['3830', 'Terra Cotta', [185, 85, 68]], ['355', 'Terra Cotta DK', [152, 68, 54]], ['3777', 'Terra Cotta VY DK', [134, 48, 34]],
  ['353', 'Peach', [254, 215, 204]], ['352', 'Coral LT', [253, 156, 151]], ['351', 'Coral', [233, 106, 103]],
  ['350', 'Coral MD', [224, 72, 72]], ['349', 'Coral DK', [210, 16, 53]], ['817', 'Coral Red VY DK', [187, 5, 31]],
  ['666', 'Bright Red', [227, 29, 66]], ['321', 'Red', [199, 43, 59]], ['304', 'Red MD', [183, 31, 51]],
  ['498', 'Red DK', [167, 19, 43]], ['816', 'Garnet', [151, 11, 35]], ['815', 'Garnet MD', [135, 7, 31]],
  ['814', 'Garnet DK', [123, 0, 27]], ['902', 'Garnet VY DK', [130, 38, 55]],
  ['3716', 'Dusty Rose VY LT', [255, 189, 189]], ['761', 'Salmon LT', [255, 201, 201]], ['760', 'Salmon', [245, 173, 173]],
  ['3712', 'Salmon MD', [241, 135, 135]], ['3328', 'Salmon DK', [227, 109, 109]], ['347', 'Salmon VY DK', [191, 45, 45]],
  ['818', 'Baby Pink', [255, 223, 217]], ['776', 'Pink MD', [252, 176, 185]], ['3326', 'Rose LT', [251, 173, 180]],
  ['899', 'Rose MD', [242, 118, 136]], ['335', 'Rose', [238, 84, 110]], ['309', 'Rose DK', [186, 74, 74]],
  ['326', 'Rose VY DK', [179, 59, 75]], ['3708', 'Melon LT', [255, 203, 213]], ['3706', 'Melon MD', [255, 173, 188]],
  ['3705', 'Melon DK', [255, 121, 140]], ['3801', 'Melon VY DK', [231, 73, 103]],
  ['225', 'Shell Pink UL VY LT', [255, 223, 213]], ['224', 'Shell Pink VY LT', [235, 183, 175]], ['223', 'Shell Pink LT', [204, 132, 124]],
  ['3722', 'Shell Pink MD', [188, 108, 100]], ['3721', 'Shell Pink DK', [161, 75, 81]], ['221', 'Shell Pink VY DK', [136, 62, 67]],
  ['3689', 'Mauve LT', [251, 191, 194]], ['3688', 'Mauve MD', [231, 169, 172]], ['3687', 'Mauve', [201, 107, 112]],
  ['3685', 'Mauve VY DK', [136, 21, 49]], ['3733', 'Dusty Rose', [232, 135, 155]], ['3731', 'Dusty Rose VY DK', [218, 103, 131]],
  ['3350', 'Dusty Rose UL DK', [188, 67, 101]],
  ['604', 'Cranberry LT', [255, 176, 190]], ['603', 'Cranberry', [255, 164, 190]], ['602', 'Cranberry MD', [226, 72, 116]],
  ['601', 'Cranberry DK', [209, 40, 106]], ['600', 'Cranberry VY DK', [205, 47, 99]], ['3806', 'Cyclamen Pink LT', [255, 140, 174]],
  ['3805', 'Cyclamen Pink', [243, 71, 139]], ['3804', 'Cyclamen Pink DK', [224, 40, 118]],
  ['3609', 'Plum UL LT', [244, 174, 213]], ['3608', 'Plum VY LT', [234, 156, 196]], ['3607', 'Plum LT', [197, 73, 137]],
  ['718', 'Plum', [156, 36, 98]], ['917', 'Plum MD', [155, 19, 89]], ['915', 'Plum DK', [130, 0, 67]],
  ['3836', 'Grape LT', [186, 145, 170]], ['3835', 'Grape MD', [148, 96, 131]], ['3834', 'Grape DK', [114, 55, 93]],
  ['154', 'Grape VY DK', [87, 36, 51]], ['3042', 'Antique Violet LT', [183, 157, 167]], ['3041', 'Antique Violet MD', [149, 111, 124]],
  ['3740', 'Antique Violet DK', [120, 87, 98]],
  ['211', 'Lavender LT', [227, 203, 227]], ['210', 'Lavender MD', [195, 159, 195]], ['209', 'Lavender DK', [163, 123, 167]],
  ['208', 'Lavender VY DK', [131, 91, 139]], ['327', 'Violet DK', [99, 54, 102]], ['550', 'Violet VY DK', [92, 24, 78]],
  ['552', 'Violet MD', [128, 58, 107]], ['553', 'Violet', [163, 99, 139]], ['554', 'Violet LT', [219, 179, 203]],
  ['3747', 'Blue Violet VY LT', [211, 215, 237]], ['341', 'Blue Violet LT', [183, 191, 221]], ['156', 'Blue Violet MD LT', [163, 174, 209]],
  ['340', 'Blue Violet MD', [173, 167, 199]], ['155', 'Blue Violet MD DK', [152, 145, 182]], ['3746', 'Blue Violet DK', [119, 107, 152]],
  ['333', 'Blue Violet VY DK', [92, 84, 120]],
  ['3840', 'Lavender Blue LT', [176, 192, 218]], ['3839', 'Lavender Blue MD', [123, 142, 171]], ['3838', 'Lavender Blue DK', [92, 114, 148]],
  ['794', 'Cornflower Blue LT', [143, 156, 193]], ['793', 'Cornflower Blue MD', [112, 125, 162]], ['3807', 'Cornflower Blue', [96, 103, 140]],
  ['792', 'Cornflower Blue DK', [85, 91, 123]], ['800', 'Delft Blue Pale', [192, 204, 222]], ['809', 'Delft Blue', [148, 168, 198]],
  ['799', 'Delft Blue MD', [116, 142, 182]], ['798', 'Delft Blue DK', [70, 106, 142]], ['797', 'Royal Blue', [19, 71, 125]],
  ['796', 'Royal Blue DK', [17, 65, 109]], ['820', 'Royal Blue VY DK', [14, 54, 92]],
  ['336', 'Navy Blue', [37, 59, 115]], ['823', 'Navy Blue DK', [33, 48, 99]], ['939', 'Navy Blue VY DK', [27, 40, 83]],
  ['775', 'Baby Blue VY LT', [217, 235, 241]], ['3325', 'Baby Blue LT', [184, 210, 230]], ['3755', 'Baby Blue', [147, 180, 206]],
  ['334', 'Baby Blue MD', [115, 159, 193]], ['322', 'Baby Blue DK', [90, 143, 184]], ['312', 'Baby Blue VY DK', [53, 102, 139]],
  ['3752', 'Antique Blue VY LT', [199, 209, 219]], ['932', 'Antique Blue LT', [162, 181, 198]], ['931', 'Antique Blue MD', [106, 133, 158]],
  ['930', 'Antique Blue DK', [69, 92, 113]], ['3750', 'Antique Blue VY DK', [56, 76, 94]],
  ['747', 'Peacock Blue VY LT', [229, 252, 253]], ['519', 'Sky Blue', [126, 177, 200]], ['518', 'Wedgewood LT', [79, 147, 167]],
  ['3760', 'Wedgewood MD', [62, 133, 162]], ['517', 'Wedgewood DK', [59, 118, 143]], ['3842', 'Wedgewood VY DK', [50, 82, 102]],
  ['807', 'Peacock Blue', [100, 171, 186]], ['806', 'Peacock Blue DK', [61, 149, 165]], ['3765', 'Peacock Blue VY DK', [24, 101, 111]],
  ['3811', 'Turquoise VY LT', [188, 227, 230]], ['598', 'Turquoise LT', [144, 195, 204]], ['597', 'Turquoise', [91, 163, 179]],
  ['3810', 'Turquoise DK', [72, 142, 154]], ['3809', 'Turquoise VY DK', [63, 124, 133]], ['3808', 'Turquoise UL VY DK', [54, 105, 112]],
  ['996', 'Electric Blue MD', [48, 194, 236]], ['3843', 'Electric Blue', [20, 170, 208]], ['995', 'Electric Blue DK', [38, 150, 182]],
  ['3846', 'Turquoise Bright LT', [6, 227, 230]], ['3845', 'Turquoise Bright MD', [4, 196, 202]], ['3844', 'Turquoise Bright DK', [18, 174, 186]],
  ['928', 'Gray Green VY LT', [221, 227, 227]], ['927', 'Gray Green LT', [189, 203, 203]], ['926', 'Gray Green MD', [152, 174, 174]],
  ['3768', 'Gray Green DK', [101, 127, 127]], ['924', 'Gray Green VY DK', [86, 106, 106]],
  ['504', 'Blue Green VY LT', [196, 222, 204]], ['503', 'Blue Green MD', [123, 172, 148]], ['502', 'Blue Green', [91, 144, 113]],
  ['501', 'Blue Green DK', [57, 111, 82]], ['500', 'Blue Green VY DK', [4, 77, 51]], ['3817', 'Celadon Green LT', [153, 195, 170]],
  ['3816', 'Celadon Green', [101, 165, 125]], ['3815', 'Celadon Green DK', [71, 119, 89]], ['564', 'Jade VY LT', [167, 205, 175]],
  ['563', 'Jade LT', [143, 192, 152]], ['562', 'Jade MD', [83, 151, 106]], ['561', 'Jade VY DK', [44, 106, 69]],
  ['955', 'Nile Green LT', [162, 214, 173]], ['954', 'Nile Green', [136, 186, 145]], ['913', 'Nile Green MD', [109, 171, 119]],
  ['912', 'Emerald Green LT', [27, 157, 107]], ['911', 'Emerald Green MD', [24, 144, 101]], ['910', 'Emerald Green DK', [24, 126, 86]],
  ['909', 'Emerald Green VY DK', [21, 111, 73]],
  ['704', 'Chartreuse Bright', [158, 207, 52]], ['703', 'Chartreuse', [123, 181, 71]], ['702', 'Kelly Green', [71, 167, 47]],
  ['701', 'Green LT', [63, 143, 41]], ['700', 'Green Bright', [7, 115, 27]], ['699', 'Green', [5, 101, 23]],
  ['907', 'Parrot Green LT', [199, 230, 102]], ['906', 'Parrot Green MD', [127, 179, 53]], ['905', 'Parrot Green DK', [98, 138, 40]],
  ['904', 'Parrot Green VY DK', [85, 120, 34]], ['895', 'Hunter Green VY DK', [27, 83, 0]], ['3345', 'Hunter Green DK', [27, 89, 21]],
  ['3346', 'Hunter Green', [64, 106, 58]], ['3347', 'Yellow Green MD', [113, 147, 92]], ['3348', 'Yellow Green LT', [204, 217, 177]],
  ['369', 'Pistachio Green VY LT', [215, 237, 204]], ['368', 'Pistachio Green LT', [166, 194, 152]], ['320', 'Pistachio Green MD', [105, 136, 90]],
  ['367', 'Pistachio Green DK', [64, 117, 69]], ['319', 'Pistachio Green VY DK', [32, 95, 46]], ['890', 'Pistachio Green UL DK', [23, 73, 35]],
  ['989', 'Forest Green', [141, 166, 117]], ['988', 'Forest Green MD', [115, 139, 91]], ['987', 'Forest Green DK', [88, 113, 65]],
  ['986', 'Forest Green VY DK', [64, 82, 48]], ['3053', 'Green Gray', [156, 164, 130]], ['3052', 'Green Gray MD', [136, 146, 104]],
  ['3051', 'Green Gray DK', [95, 102, 72]], ['3013', 'Khaki Green LT', [176, 178, 122]], ['3012', 'Khaki Green MD', [166, 167, 93]],
  ['3011', 'Khaki Green DK', [137, 138, 88]], ['524', 'Fern Green VY LT', [196, 205, 172]], ['523', 'Fern Green LT', [171, 177, 151]],
  ['522', 'Fern Green', [150, 158, 126]], ['520', 'Fern Green DK', [102, 109, 79]], ['3364', 'Pine Green', [131, 151, 95]],
  ['3363', 'Pine Green MD', [114, 130, 86]], ['3362', 'Pine Green DK', [94, 107, 71]],
  ['472', 'Avocado Green UL LT', [216, 228, 152]], ['471', 'Avocado Green VY LT', [174, 191, 121]], ['470', 'Avocado Green LT', [148, 171, 79]],
  ['469', 'Avocado Green', [114, 132, 60]], ['937', 'Avocado Green MD', [98, 113, 51]], ['936', 'Avocado Green VY DK', [76, 88, 38]],
  ['935', 'Avocado Green DK', [66, 77, 33]], ['934', 'Black Avocado Green', [49, 57, 25]],
];

/**
 * Colour Index pigment codes for the paint names Inkloom uses (see processing/colorNames.ts).
 * The code is printed on every tube, so it finds the same colour across brands. Hues that are
 * usually sold as convenience mixes (Payne's grey, sap green, Naples yellow…) have no single code.
 */
const PIGMENTS: Record<string, string> = {
  'Titanium white': 'PW6',
  'Lemon yellow': 'PY3',
  'Cadmium yellow': 'PY35',
  'Yellow ochre': 'PY43',
  'Raw sienna': 'PBr7',
  'Cadmium orange': 'PO20',
  'Burnt sienna': 'PBr7',
  'Burnt umber': 'PBr7',
  'Raw umber': 'PBr7',
  'Cadmium red': 'PR108',
  'Alizarin crimson': 'PR83',
  'Quinacridone magenta': 'PR122',
  'Dioxazine purple': 'PV23',
  Ultramarine: 'PB29',
  'Cobalt blue': 'PB28',
  'Cerulean blue': 'PB35',
  'Prussian blue': 'PB27',
  'Phthalo turquoise': 'PB16',
  Viridian: 'PG18',
  'Phthalo green': 'PG7',
  'Terre verte': 'PG23',
  'Ivory black': 'PBk9',
};

const DMC_LAB = DMC.map(([, , rgb]) => toLab(rgb));

/** Closest DMC floss to a colour (CIE76 distance in Lab). */
export function nearestDmc(rgb: Rgb): { code: string; name: string } {
  const [l, a, b] = toLab(rgb);
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < DMC_LAB.length; i++) {
    const [l2, a2, b2] = DMC_LAB[i];
    const d = (l - l2) ** 2 + (a - a2) ** 2 + (b - b2) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  const [code, name] = DMC[best];
  return { code, name };
}

const PAINT_WORD: Partial<Record<Medium, string>> = {
  watercolor: 'watercolor paint',
  acrylic: 'acrylic paint',
  'paint-by-number': 'acrylic paint',
};

/**
 * Adds what to buy for each palette colour. Embroidery swaps the paint name for the closest DMC
 * thread, so the plan and materials list name real skeins. Paints keep their name and gain the
 * pigment code. Mediums without a palette (pencil, tattoo) are returned unchanged.
 */
export function shoppingPalette(medium: Medium, palette: PaletteColor[]): ShoppingColor[] {
  if (medium === 'embroidery') {
    return palette.map((c) => {
      const thread = nearestDmc(c.rgb);
      const code = `DMC ${thread.code}`;
      return { ...c, name: `${code} ${thread.name}`, code, shopUrl: shopLink(`${code} embroidery floss`) };
    });
  }
  const word = PAINT_WORD[medium];
  if (!word) return palette;
  return palette.map((c) => ({ ...c, code: PIGMENTS[c.name], shopUrl: shopLink(`${c.name} ${word}`) }));
}
