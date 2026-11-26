import { Category, MenuItem, RestaurantTable } from '../types';
import { AppLanguage } from './types';

interface LocalizedDishFields {
  name: string;
  description: string;
  weight_or_portion?: string;
  tags?: string[];
}

export const CATEGORY_TRANSLATIONS: Record<string, Record<AppLanguage, string>> = {
  'cat-all': { uz: 'Barchasi', en: 'All', ru: 'Все' },
  'cat-milliy': { uz: 'Milliy taomlar', en: 'National Dishes', ru: 'Национальные блюда' },
  'cat-fastfood': { uz: 'Fast food & Kabob', en: 'Fast Food & Kebab', ru: 'Фастфуд и Шашлык' },
  'cat-salatlar': { uz: 'Salatlar', en: 'Salads', ru: 'Салаты' },
  'cat-ichimliklar': { uz: 'Ichimliklar', en: 'Drinks', ru: 'Напитки' },
  'cat-desertlar': { uz: 'Desertlar', en: 'Desserts', ru: 'Десерты' },
};

export const DISH_TRANSLATIONS: Record<string, Record<'en' | 'ru', LocalizedDishFields>> = {
  'dish-1': {
    en: {
      name: 'Wedding Plov (Special)',
      description: 'Royal festive pilaf served with tender beef, yellow carrots, chickpeas, raisins, quail egg, and horse-meat qazi slices.',
      weight_or_portion: '450 g',
      tags: ['VIP Dish', "Chef's Pick", 'Bestseller'],
    },
    ru: {
      name: 'Свадебный плов (Особый)',
      description: 'Праздничный царский плов с нежной говядиной, жёлтой морковью, нутом, изюмом, перепелиным яйцом и ломтиками казы.',
      weight_or_portion: '450 г',
      tags: ['VIP Блюдо', 'Выбор шефа', 'Хит продаж'],
    },
  },
  'dish-2': {
    en: {
      name: 'Kazan Kebab',
      description: 'Pan-seared fresh lamb ribs with golden baby potatoes and spiced red onion rings.',
      weight_or_portion: '400 g',
      tags: ['VIP Dish', 'New Dish', 'Bestseller'],
    },
    ru: {
      name: 'Казан-кебаб',
      description: 'Обжаренные рёбрышки молодого барашка с золотистым картофелем и пряным красным луком.',
      weight_or_portion: '400 г',
      tags: ['VIP Блюдо', 'Новинка', 'Хит продаж'],
    },
  },
  'dish-3': {
    en: {
      name: 'Chust Tandoor Somsa',
      description: 'Flaky pastry filled with finely chopped beef and tail fat, baked in a clay tandoor and topped with black sesame.',
      weight_or_portion: '180 g (1 pc)',
      tags: ['Classic Dish', 'Hot from Tandoor'],
    },
    ru: {
      name: 'Чустская самса (Тандырная)',
      description: 'Слоёное тесто с рубленой говядиной и курдючным жиром, выпеченное в тандыре с ароматным кунжутом.',
      weight_or_portion: '180 г (1 шт)',
      tags: ['Обычное блюдо', 'Из тандыра'],
    },
  },
  'dish-4': {
    en: {
      name: 'Gijduvan Shashlik',
      description: 'Signature marinated minced and cubed beef kebab grilled over glowing charcoal.',
      weight_or_portion: '150 g (1 skewer)',
      tags: ['Business Dish', 'Charcoal Grilled'],
    },
    ru: {
      name: 'Гиждуванский шашлык',
      description: 'Фирменный маринованный шашлык из рубленого мяса и кусочков говядины на древесных углях.',
      weight_or_portion: '150 г (1 шампур)',
      tags: ['Бизнес блюдо', 'На углях'],
    },
  },
  'dish-5': {
    en: {
      name: 'Achichuk Salad',
      description: 'Traditional pilaf salad made with ripe sweet Samarkand tomatoes, thinly sliced onions, chili pepper, and fresh basil.',
      weight_or_portion: '200 g',
      tags: ['Classic Dish', 'Natural', 'Vitamin-Rich'],
    },
    ru: {
      name: 'Салат Ачичук',
      description: 'Традиционный салат к плову из спелых самаркандских томатов, тонко нарезанного лука, перца и свежего базилика.',
      weight_or_portion: '200 г',
      tags: ['Обычное блюдо', 'Натуральный', 'Витаминный'],
    },
  },
  'dish-6': {
    en: {
      name: 'Uyghur Fried Lagman',
      description: 'Hand-pulled tender noodles stir-fried with beef, garlic, aromatic vegetables, and signature spicy sauce.',
      weight_or_portion: '400 g',
      tags: ['Classic Dish', 'Hearty'],
    },
    ru: {
      name: 'Уйгурский жареный лагман',
      description: 'Тонкая лапша ручной работы, обжаренная с говядиной, чесноком, ароматными овощами и фирменным соусом.',
      weight_or_portion: '400 г',
      tags: ['Обычное блюдо', 'Сытный'],
    },
  },
  'dish-7': {
    en: {
      name: 'Chortoq Lamb Shurpa',
      description: 'Clear aromatic soup with fresh lamb, whole sweet chickpeas, juicy vegetables, and fresh basil.',
      weight_or_portion: '450 ml',
      tags: ['Classic Dish', 'Hot Soup'],
    },
    ru: {
      name: 'Шурпа Чартак (из баранины)',
      description: 'Прозрачный ароматный суп со свежей бараниной, цельным нутом, сочными овощами и свежим базиликом.',
      weight_or_portion: '450 мл',
      tags: ['Обычное блюдо', 'Горячий суп'],
    },
  },
  'dish-8': {
    en: {
      name: 'Samarkand Jiz-Biz',
      description: 'Tender young veal loin and ribs pan-seared over charcoal with golden onions and juniper spices.',
      weight_or_portion: '380 g',
      tags: ['VIP Dish', 'Meat Specialty'],
    },
    ru: {
      name: 'Джиз-биз (по-самаркандски)',
      description: 'Нежная телятина и рёбрышки, обжаренные на углях с золотистым луком и ароматными специями.',
      weight_or_portion: '380 г',
      tags: ['VIP Блюдо', 'Мясное'],
    },
  },
  'dish-9': {
    en: {
      name: 'Steamed Beef Manti',
      description: 'Delicate thin dough dumplings filled with hand-chopped fresh beef and onions, steamed to perfection.',
      weight_or_portion: '350 g (4 pcs)',
      tags: ['Business Dish', 'Steamed'],
    },
    ru: {
      name: 'Манты (с рубленой говядиной)',
      description: 'Тонкое тесто с мелко рубленной свежей говядиной и луком, приготовленные на пару.',
      weight_or_portion: '350 г (4 шт)',
      tags: ['Бизнес блюдо', 'На пару'],
    },
  },
  'dish-10': {
    en: {
      name: 'Tashkent Norin with Qazi',
      description: 'Traditional Tashkent delicacy of finely sliced hand-rolled noodles, boiled horse meat, fresh qazi, and cumin.',
      weight_or_portion: '300 g',
      tags: ['VIP Dish', 'With Qazi', 'Tashkent'],
    },
    ru: {
      name: 'Нарын (с ломтиками казы)',
      description: 'Традиционный ташкентский нарын из тонко нарезанной домашней лапши, конины, свежего казы и зиры.',
      weight_or_portion: '300 г',
      tags: ['VIP Блюдо', 'С казы', 'Ташкент'],
    },
  },
  'dish-11': {
    en: {
      name: 'Chuchvara Dumpling Soup',
      description: 'Miniature tender meat dumplings served in rich beef broth with fresh herbs and butter.',
      weight_or_portion: '400 ml',
      tags: ['Classic Dish', 'Homestyle'],
    },
    ru: {
      name: 'Суп Чучвара',
      description: 'Миниатюрные нежные пельмени в насыщенном мясном бульоне со свежей зеленью и сливочным маслом.',
      weight_or_portion: '400 мл',
      tags: ['Обычное блюдо', 'Домашнее'],
    },
  },
  'dish-12': {
    en: {
      name: 'Crispy Chicken Tabaka',
      description: 'Pan-pressed crispy golden spring chicken served with garlic sauce and fresh lavash flatbread.',
      weight_or_portion: '500 g',
      tags: ['Business Dish', 'Crispy'],
    },
    ru: {
      name: 'Цыплёнок табака (хрустящий)',
      description: 'Хрустящий золотистый цыплёнок, обжаренный под прессом, с чесночным соусом и свежим лавашом.',
      weight_or_portion: '500 г',
      tags: ['Бизнес блюдо', 'Хрустящее'],
    },
  },
  'dish-13': {
    en: {
      name: 'Lamb Dimlama Stew',
      description: 'Slow-steamed tender lamb in a cauldron with cabbage, potatoes, carrots, and sweet bell peppers.',
      weight_or_portion: '450 g',
      tags: ['Business Dish', 'Slow-Steamed'],
    },
    ru: {
      name: 'Дымляма из баранины',
      description: 'Нежная баранина, томлённая в собственном соку с капустой, картофелем, морковью и болгарским перцем.',
      weight_or_portion: '450 г',
      tags: ['Бизнес блюдо', 'Томлёное'],
    },
  },
  'dish-14': {
    en: {
      name: 'Royal Beshbarmak',
      description: 'Wide hand-rolled pasta sheets topped with tender boiled qazi, horse meat, beef, and hot onion broth.',
      weight_or_portion: '450 g',
      tags: ['VIP Dish', 'Royal'],
    },
    ru: {
      name: 'Бешбармак (Царский)',
      description: 'Широкие листы домашнего теста с нежным отварным казы, кониной, говядиной и горячим луковым бульоном.',
      weight_or_portion: '450 г',
      tags: ['VIP Блюдо', 'Царское'],
    },
  },
  'dish-15': {
    en: {
      name: 'Lyulya Kebab',
      description: 'Juicy spiced minced meat kebab grilled over open embers, served with pickled red onions.',
      weight_or_portion: '140 g (1 skewer)',
      tags: ['Classic Dish', 'Charcoal Grilled'],
    },
    ru: {
      name: 'Люля-кебаб',
      description: 'Сочный шашлык из пряного мясного фарша, приготовленный на углях, с маринованным красным луком.',
      weight_or_portion: '140 г (1 шампур)',
      tags: ['Обычное блюдо', 'На углях'],
    },
  },
  'dish-16': {
    en: {
      name: 'Khorezm Tukhum Barak',
      description: 'Famous Khorezm delicate dumplings filled with whisked egg and milk, gently poached in boiling water.',
      weight_or_portion: '300 g',
      tags: ['Business Dish', 'Khorezm'],
    },
    ru: {
      name: 'Хорезмский Тухум-барак',
      description: 'Знаменитое хорезмское блюдо из тонкого теста с нежной яично-молочной начинкой.',
      weight_or_portion: '300 г',
      tags: ['Бизнес блюдо', 'Хорезм'],
    },
  },
  'dish-17': {
    en: {
      name: 'Minced Beef Shashlik (Special)',
      description: 'Aromatic charcoal-grilled minced kebab crafted from a balanced blend of beef and lamb.',
      weight_or_portion: '130 g (1 skewer)',
      tags: ['Classic Dish', 'Bestseller'],
    },
    ru: {
      name: 'Молотый шашлык (Особый)',
      description: 'Ароматный шашлык на углях из идеально сбалансированного фарша говядины и баранины.',
      weight_or_portion: '130 г (1 шампур)',
      tags: ['Обычное блюдо', 'Хит продаж'],
    },
  },
  'dish-18': {
    en: {
      name: 'Spring Salad with Suzma',
      description: 'Light refreshing salad of crisp cucumbers, radishes, green onions, dill, and pure mountain strained yogurt.',
      weight_or_portion: '220 g',
      tags: ['Classic Dish', 'Light & Healthy'],
    },
    ru: {
      name: 'Весенний салат (с сюзьмой)',
      description: 'Лёгкий освежающий салат из свежих огурцов, редиса, зелёного лука, укропа и горной сюзьмы.',
      weight_or_portion: '220 г',
      tags: ['Обычное блюдо', 'Диетический'],
    },
  },
  'dish-19': {
    en: {
      name: 'DineFlow Burger & Fries',
      description: '100% juicy beef patty, melted cheddar cheese, crisp fresh vegetables, and golden French fries.',
      weight_or_portion: '350 g',
      tags: ['Business Dish', 'Fast Food'],
    },
    ru: {
      name: 'Бургер DineFlow и Фри',
      description: 'Сочная 100% говяжья котлета, расплавленный сыр чеддер, свежие овощи и хрустящий картофель фри.',
      weight_or_portion: '350 г',
      tags: ['Бизнес блюдо', 'Фастфуд'],
    },
  },
  'dish-20': {
    en: {
      name: 'Beef Ribeye Steak',
      description: 'Tender grain-fed beef ribeye seared to perfection and served with butter-glazed seasonal vegetables.',
      weight_or_portion: '320 g',
      tags: ['VIP Dish', 'Premium'],
    },
    ru: {
      name: 'Стейк Рибай из говядины',
      description: 'Нежный стейк из говядины зернового откорма, подаётся с овощами в сливочном масле.',
      weight_or_portion: '320 г',
      tags: ['VIP Блюдо', 'Премиум'],
    },
  },
  'dish-drink-1': {
    en: {
      name: 'Green Tea (Lemon & Navvat)',
      description: 'Mountain green tea brewed in a porcelain teapot, served with fresh lemon slices and Samarkand crystal sugar.',
      weight_or_portion: '800 ml (teapot)',
      tags: ['Classic', 'Hot Tea'],
    },
    ru: {
      name: 'Зелёный чай (Лимон и Навват)',
      description: 'Горный зелёный чай в фарфоровом чайнике со свежим лимоном и самаркандским белым навватом.',
      weight_or_portion: '800 мл (чайник)',
      tags: ['Обычный', 'Горячий чай'],
    },
  },
  'dish-drink-2': {
    en: {
      name: 'Black Tea with Mountain Herbs',
      description: 'Premium Ceylon black tea infused with fragrant mountain thyme and fresh mint leaves.',
      weight_or_portion: '800 ml (teapot)',
      tags: ['Classic', 'Herbal'],
    },
    ru: {
      name: 'Чёрный чай (с горными травами)',
      description: 'Отборный цейлонский чёрный чай, заваренный с душистым чабрецом и свежей мятой.',
      weight_or_portion: '800 мл (чайник)',
      tags: ['Обычный', 'Травяной'],
    },
  },
  'dish-drink-3': {
    en: {
      name: 'Homemade Berry Mors',
      description: 'Chilled refreshing fruit drink brewed from natural red currants, raspberries, and mountain sour cherries.',
      weight_or_portion: '500 ml',
      tags: ['Business', 'Chilled', 'Natural'],
    },
    ru: {
      name: 'Ягодный морс (Домашний)',
      description: 'Освежающий холодный напиток из натуральной красной смородины, малины и горной вишни.',
      weight_or_portion: '500 мл',
      tags: ['Бизнес', 'Охлаждённый', 'Натуральный'],
    },
  },
  'dish-drink-4': {
    en: {
      name: 'Freshly Squeezed Orange Juice',
      description: '100% natural vitamin-rich juice freshly pressed from ripe oranges upon order.',
      weight_or_portion: '300 ml',
      tags: ['VIP', 'Fresh', 'Vitamin C'],
    },
    ru: {
      name: 'Свежевыжатый апельсиновый сок',
      description: 'Натуральный витаминный сок, выжатый из спелых апельсинов сразу после заказа.',
      weight_or_portion: '300 мл',
      tags: ['VIP', 'Фреш', 'Витамин C'],
    },
  },
  'dish-drink-5': {
    en: {
      name: 'Chilled Mint Ayran',
      description: 'Traditional cold yogurt drink prepared from homemade katyk with fresh mint leaves and ice.',
      weight_or_portion: '400 ml',
      tags: ['Classic', 'Chilled', 'National'],
    },
    ru: {
      name: 'Холодный айран (с мятой)',
      description: 'Традиционный прохладительный напиток из домашнего катыка со свежей мятой и льдом.',
      weight_or_portion: '400 мл',
      tags: ['Обычный', 'Прохладительный', 'Национальный'],
    },
  },
  'dish-dessert-1': {
    en: {
      name: 'Honey Walnut Baklava',
      description: 'Eastern layered pastry generously filled with crushed walnuts, pure mountain honey, and butter.',
      weight_or_portion: '160 g (2 pcs)',
      tags: ['Business', 'Sweet'],
    },
    ru: {
      name: 'Медовая пахлава (с грецким орехом)',
      description: 'Восточная слоёная сладость с грецкими орехами, горным мёдом и сливочным маслом.',
      weight_or_portion: '160 г (2 шт)',
      tags: ['Бизнес', 'Сладость'],
    },
  },
  'dish-dessert-2': {
    en: {
      name: 'New York Cheesecake',
      description: 'Silky baked cream-cheese cheesecake drizzled with tangy forest berry sauce.',
      weight_or_portion: '170 g',
      tags: ['Business', 'Classic'],
    },
    ru: {
      name: 'Чизкейк Нью-Йорк',
      description: 'Нежный запечённый чизкейк из сливочного сыра с ароматным ягодным соусом.',
      weight_or_portion: '170 г',
      tags: ['Бизнес', 'Классика'],
    },
  },
  'dish-dessert-3': {
    en: {
      name: 'Chocolate Fondant with Ice Cream',
      description: 'Warm delicate cake with a molten Belgian chocolate center served with vanilla ice cream.',
      weight_or_portion: '200 g',
      tags: ['VIP', 'Warm Dessert'],
    },
    ru: {
      name: 'Шоколадный фондан (с мороженым)',
      description: 'Нежный горячий кекс с жидким бельгийским шоколадом внутри и шариком ванильного мороженого.',
      weight_or_portion: '200 г',
      tags: ['VIP', 'Горячий десерт'],
    },
  },
  'dish-dessert-4': {
    en: {
      name: 'Traditional Chak-Chak',
      description: 'Golden crispy fried dough pieces glazed with pure fragrant floral honey syrup.',
      weight_or_portion: '180 g',
      tags: ['Classic', 'Honey'],
    },
    ru: {
      name: 'Традиционный Чак-чак',
      description: 'Золотистые хрустящие кусочки теста, пропитанные натуральным медовым сиропом.',
      weight_or_portion: '180 г',
      tags: ['Обычный', 'Медовый'],
    },
  },
  'dish-dessert-5': {
    en: {
      name: 'Classic Medovik Honey Cake',
      description: 'Multi-layered delicate honey sponge cake with velvety sour-cream frosting.',
      weight_or_portion: '160 g',
      tags: ['Classic', 'Classic'],
    },
    ru: {
      name: 'Торт Медовик (Классический)',
      description: 'Многослойные медовые коржи с нежным сметанно-сливочным кремом.',
      weight_or_portion: '160 г',
      tags: ['Обычный', 'Классика'],
    },
  },
};

// Reverse lookup by Uzbek dish name so orders/reviews referencing item_name also translate accurately
const DISH_BY_UZ_NAME: Record<string, { en: string; ru: string }> = {
  "to'y oshi (maxsus)": { en: 'Wedding Plov (Special)', ru: 'Свадебный плов (Особый)' },
  "to'y oshi": { en: 'Wedding Plov', ru: 'Свадебный плов' },
  'qozon kabob': { en: 'Kazan Kebab', ru: 'Казан-кебаб' },
  'chust somsasi (tandir)': { en: 'Chust Tandoor Somsa', ru: 'Чустская самса (Тандырная)' },
  'tandir somsa': { en: 'Tandoor Somsa', ru: 'Тандырная самса' },
  "g'ijduvon shashlik": { en: 'Gijduvan Shashlik', ru: 'Гиждуванский шашлык' },
  'achchiq-chuchuk salati': { en: 'Achichuk Salad', ru: 'Салат Ачичук' },
  "uyg'ur lag'mon (qovurma)": { en: 'Uyghur Fried Lagman', ru: 'Уйгурский жареный лагман' },
  "chortoq sho'rva (qo'zichoq)": { en: 'Chortoq Lamb Shurpa', ru: 'Шурпа Чартак (из баранины)' },
  'jiz-biz (samarqandcha)': { en: 'Samarkand Jiz-Biz', ru: 'Джиз-биз (по-самаркандски)' },
  "manti (lahm mol go'shti)": { en: 'Steamed Beef Manti', ru: 'Манты (с рубленой говядиной)' },
  "norin (qazi bo'laklari bilan)": { en: 'Tashkent Norin with Qazi', ru: 'Нарын (с ломтиками казы)' },
  "chuchvara sho'rva": { en: 'Chuchvara Dumpling Soup', ru: 'Суп Чучвара' },
  'tovuq tabaka (qarsildoq)': { en: 'Crispy Chicken Tabaka', ru: 'Цыплёнок табака (хрустящий)' },
  "qo'y go'shtli dimlama": { en: 'Lamb Dimlama Stew', ru: 'Дымляма из баранины' },
  'beshbarmak (shohona)': { en: 'Royal Beshbarmak', ru: 'Бешбармак (Царский)' },
  'lyulya kabob': { en: 'Lyulya Kebab', ru: 'Люля-кебаб' },
  'xorazmcha tuxum barak': { en: 'Khorezm Tukhum Barak', ru: 'Хорезмский Тухум-барак' },
  'qiyma shashlik (maxsus)': { en: 'Minced Beef Shashlik (Special)', ru: 'Молотый шашлык (Особый)' },
  'bahor salati (suzmali)': { en: 'Spring Salad with Suzma', ru: 'Весенний салат (с сюзьмой)' },
  'dineflow burger & fri': { en: 'DineFlow Burger & Fries', ru: 'Бургер DineFlow и Фри' },
  "mol go'shtli steak (ribeye)": { en: 'Beef Ribeye Steak', ru: 'Стейк Рибай из говядины' },
  "ko'k choy (limon & novvot)": { en: 'Green Tea (Lemon & Navvat)', ru: 'Зелёный чай (Лимон и Навват)' },
  "qora choy (tog' giyohlari bilan)": { en: 'Black Tea with Mountain Herbs', ru: 'Чёрный чай (с горными травами)' },
  'meva morssi (xonaki)': { en: 'Homemade Berry Mors', ru: 'Ягодный морс (Домашний)' },
  'yangi siqilgan apelsin sharbati': { en: 'Freshly Squeezed Orange Juice', ru: 'Свежевыжатый апельсиновый сок' },
  'muzdek ayron (yalpizli)': { en: 'Chilled Mint Ayran', ru: 'Холодный айран (с мятой)' },
  "asalli paxlava (yong'oqli)": { en: 'Honey Walnut Baklava', ru: 'Медовая пахлава (с грецким орехом)' },
  'nyu-york chizkeyk': { en: 'New York Cheesecake', ru: 'Чизкейк Нью-Йорк' },
  'shokoladli fondan (muzqaymoq bilan)': { en: 'Chocolate Fondant with Ice Cream', ru: 'Шоколадный фондан (с мороженым)' },
  "an'anaviy chak-chak": { en: 'Traditional Chak-Chak', ru: 'Традиционный Чак-чак' },
  'medovik torti (klassik)': { en: 'Classic Medovik Honey Cake', ru: 'Торт Медовик (Классический)' },
};

// Smart culinary & dynamic term fallback for newly added menu items/categories/notes
const DYNAMIC_CULINARY_TERMS: Array<[RegExp, string, string]> = [
  [/\bmilliy taomlar\b/gi, 'National Dishes', 'Национальные блюда'],
  [/\bissiq taomlar\b/gi, 'Hot Dishes', 'Горячие блюда'],
  [/\bsovuq taomlar\b/gi, 'Cold Dishes', 'Холодные блюда'],
  [/\byaxna ichimliklar\b/gi, 'Cold Drinks', 'Прохладительные напитки'],
  [/\bissiq ichimliklar\b/gi, 'Hot Drinks', 'Горячие напитки'],
  [/\bichimliklar\b/gi, 'Drinks', 'Напитки'],
  [/\bsalatlar\b/gi, 'Salads', 'Салаты'],
  [/\bdesertlar\b/gi, 'Desserts', 'Десерты'],
  [/\bshirinliklar\b/gi, 'Sweets', 'Сладости'],
  [/\bnonlar\b/gi, 'Breads', 'Хлеб и лепёшки'],
  [/\bnon\b/gi, 'Bread', 'Лепёшка'],
  [/\bosh\b/gi, 'Plov', 'Плов'],
  [/\bpalov\b/gi, 'Plov', 'Плов'],
  [/\bsho['’ʻ]rva\b/gi, 'Shurpa Soup', 'Шурпа'],
  [/\blag['’ʻ]mon\b/gi, 'Lagman', 'Лагман'],
  [/\bmanti\b/gi, 'Manti', 'Манты'],
  [/\bsomsa\b/gi, 'Somsa', 'Самса'],
  [/\bshashlik\b/gi, 'Shashlik', 'Шашлык'],
  [/\bkabob\b/gi, 'Kebab', 'Кебаб'],
  [/\bpitsa\b/gi, 'Pizza', 'Пицца'],
  [/\bburger\b/gi, 'Burger', 'Бургер'],
  [/\bsteyk\b/gi, 'Steak', 'Стейк'],
  [/\btovuq\b/gi, 'Chicken', 'Курица'],
  [/\bmol go['’ʻ]shti\b/gi, 'Beef', 'Говядина'],
  [/\bqo['’ʻ]y go['’ʻ]shti\b/gi, 'Lamb', 'Баранина'],
  [/\bgo['’ʻ]shtli\b/gi, 'Meat', 'Мясной'],
  [/\bgo['’ʻ]sht\b/gi, 'Meat', 'Мясо'],
  [/\bbaliq\b/gi, 'Fish', 'Рыба'],
  [/\bsabzavotli\b/gi, 'Vegetable', 'Овощной'],
  [/\bsabzavotlar\b/gi, 'Vegetables', 'Овощи'],
  [/\bpishloqli\b/gi, 'Cheese', 'Сырный'],
  [/\bsalat\b/gi, 'Salad', 'Салат'],
  [/\bko['’ʻ]k choy\b/gi, 'Green Tea', 'Зелёный чай'],
  [/\bqora choy\b/gi, 'Black Tea', 'Чёрный чай'],
  [/\bchoy\b/gi, 'Tea', 'Чай'],
  [/\bkofe\b/gi, 'Coffee', 'Кофе'],
  [/\bsharbat\b/gi, 'Juice', 'Сок'],
  [/\blimonad\b/gi, 'Lemonade', 'Лимонад'],
  [/\bayron\b/gi, 'Ayran', 'Айран'],
  [/\btort\b/gi, 'Cake', 'Торт'],
  [/\bmuzqaymoq\b/gi, 'Ice Cream', 'Мороженое'],
  [/\bachchiq\b/gi, 'Spicy', 'Острый'],
  [/\bsovuq\b/gi, 'Cold', 'Холодный'],
  [/\bissiq\b/gi, 'Hot', 'Горячий'],
  [/\byangi\b/gi, 'Fresh', 'Свежий'],
  [/\bmaxsus\b/gi, 'Special', 'Особый'],
  [/\bklassik\b/gi, 'Classic', 'Классический'],
  [/\bchoynak\b/gi, 'teapot', 'чайник'],
  [/\bdona\b/gi, 'pcs', 'шт'],
  [/\bsix\b/gi, 'skewer', 'шампур'],
];

export function localizeCulinaryText(text: string, lang: AppLanguage): string {
  if (!text || lang === 'uz') return text;
  const trimmed = text.trim();
  const exactDish = DISH_BY_UZ_NAME[trimmed.toLowerCase()];
  if (exactDish) return exactDish[lang];

  let out = text;
  for (const [pattern, en, ru] of DYNAMIC_CULINARY_TERMS) {
    out = out.replace(pattern, lang === 'en' ? en : ru);
  }
  if (lang === 'ru') {
    out = out.replace(/(\d+)\s*g\b/gi, '$1 г').replace(/(\d+)\s*ml\b/gi, '$1 мл');
  }
  return out;
}

export function localizeCategory(cat: Category, lang: AppLanguage): Category {
  if (lang === 'uz') return cat;
  const explicit = lang === 'en' ? cat.name_en : cat.name_ru;
  if (explicit && explicit.trim()) {
    return { ...cat, name: explicit.trim() };
  }
  const seeded = CATEGORY_TRANSLATIONS[cat.id]?.[lang];
  if (seeded) {
    return { ...cat, name: seeded };
  }
  return { ...cat, name: localizeCulinaryText(cat.name, lang) };
}

export function localizeDish(dish: MenuItem, lang: AppLanguage): MenuItem {
  if (lang === 'uz') return dish;
  const seeded = DISH_TRANSLATIONS[dish.id]?.[lang];
  const explicitName = lang === 'en' ? dish.name_en : dish.name_ru;
  const explicitDesc = lang === 'en' ? dish.description_en : dish.description_ru;

  return {
    ...dish,
    name:
      (explicitName && explicitName.trim()) ||
      seeded?.name ||
      localizeCulinaryText(dish.name, lang),
    description:
      (explicitDesc && explicitDesc.trim()) ||
      seeded?.description ||
      localizeCulinaryText(dish.description, lang),
    weight_or_portion:
      seeded?.weight_or_portion ||
      (dish.weight_or_portion ? localizeCulinaryText(dish.weight_or_portion, lang) : dish.weight_or_portion),
    tags: seeded?.tags || dish.tags?.map((tg) => localizeCulinaryText(tg, lang)),
  };
}

export function localizeOrderItemName(
  itemName: string,
  menuItemId: string | undefined,
  menuItems: MenuItem[],
  lang: AppLanguage
): string {
  if (lang === 'uz') return itemName;
  if (menuItemId) {
    const found = menuItems.find((m) => m.id === menuItemId);
    if (found) return localizeDish(found, lang).name;
    const seeded = DISH_TRANSLATIONS[menuItemId]?.[lang];
    if (seeded?.name) return seeded.name;
  }
  return localizeCulinaryText(itemName, lang);
}

export function localizeTableLabel(table: RestaurantTable | null, tableNumber: number, lang: AppLanguage): string {
  if (lang === 'uz') return table?.label || `Stol №${tableNumber}`;
  const raw = table?.label || `Stol №${tableNumber}`;
  if (lang === 'en') {
    return raw
      .replace(/Oddiy Stol/gi, 'Standard Table')
      .replace(/Biznes Stol/gi, 'Business Table')
      .replace(/Stol/gi, 'Table')
      .replace(/№/g, '#');
  }
  return raw
    .replace(/Oddiy Stol/gi, 'Обычный стол')
    .replace(/Biznes Stol/gi, 'Бизнес стол')
    .replace(/Stol/gi, 'Стол');
}
