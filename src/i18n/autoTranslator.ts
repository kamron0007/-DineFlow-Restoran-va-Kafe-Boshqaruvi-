import { AppLanguage } from './types';
import { localizeCulinaryText } from './dataTranslations';
import { UI_PHRASE_ENTRIES } from './uiDictionary';

// Normalize apostrophe variants (', ’, ‘, ʻ, `) and collapse whitespace for reliable lookup
function normalizeKey(input: string): string {
  return input
    .replace(/[’‘ʻ`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Build normalized exact-phrase lookup table once
const NORMALIZED_EXACT: Map<string, [string, string]> = new Map();
for (const [uz, en, ru] of UI_PHRASE_ENTRIES) {
  const key = normalizeKey(uz).toLowerCase();
  if (!NORMALIZED_EXACT.has(key)) {
    NORMALIZED_EXACT.set(key, [en, ru]);
  }
}

// Month abbreviations used in analytics charts & summaries
const MONTH_MAP: Record<string, [string, string]> = {
  yan: ['Jan', 'янв'],
  fev: ['Feb', 'фев'],
  mar: ['Mar', 'мар'],
  apr: ['Apr', 'апр'],
  may: ['May', 'май'],
  iyun: ['Jun', 'июн'],
  iyul: ['Jul', 'июл'],
  avg: ['Aug', 'авг'],
  sen: ['Sep', 'сен'],
  okt: ['Oct', 'окт'],
  noy: ['Nov', 'ноя'],
  dek: ['Dec', 'дек'],
};

function translateMonthAbbr(abbr: string, lang: AppLanguage): string {
  const hit = MONTH_MAP[abbr.toLowerCase()];
  if (!hit) return abbr;
  return lang === 'en' ? hit[0] : hit[1];
}

function translateMoneyInline(str: string, lang: AppLanguage): string {
  return str.replace(/so['’‘ʻ`]?m/gi, lang === 'en' ? 'UZS' : 'сум');
}

// Dynamic regex pattern rules applied when exact lookup misses
const REGEX_PATTERNS: Array<{
  regex: RegExp;
  en: (m: RegExpMatchArray) => string;
  ru: (m: RegExpMatchArray) => string;
}> = [
  // === Document Titles ===
  {
    regex: /^🔔\s*\((\d+)\)\s*Yangi buyurtma!\s*[—–-]\s*Ofitsiant Terminali$/i,
    en: (m) => `🔔 (${m[1]}) New Order! — Waiter Terminal`,
    ru: (m) => `🔔 (${m[1]}) Новый заказ! — Терминал официанта`,
  },
  {
    regex: /^(.+)\s+[—–-]\s+Boshqaruv Tizimi$/i,
    en: (m) => `${m[1]} — Management System`,
    ru: (m) => `${m[1]} — Система управления`,
  },

  // === Login / Staff Portal ===
  {
    regex: /^(.+)\s+boshqaruv tizimi$/i,
    en: (m) => `${m[1]} Management System`,
    ru: (m) => `Система управления ${m[1]}`,
  },
  {
    regex: /^(.+)\s+kabinetiga kirish$/i,
    en: (m) => `Sign in to ${translateUiText(m[1], 'en')} Portal`,
    ru: (m) => `Вход в кабинет (${translateUiText(m[1], 'ru')})`,
  },
  {
    regex: /^Yangi\s+(.+)\s+akkaunti$/i,
    en: (m) => `New ${translateUiText(m[1], 'en')} Account`,
    ru: (m) => `Новый аккаунт (${translateUiText(m[1], 'ru')})`,
  },
  {
    regex: /^(.+)\s+akkauntini yaratish$/i,
    en: (m) => `Create ${translateUiText(m[1], 'en')} Account`,
    ru: (m) => `Создать аккаунт (${translateUiText(m[1], 'ru')})`,
  },
  {
    regex: /^(.+)\s+uchun hali akkaunt yaratilmagan$/i,
    en: (m) => `No ${translateUiText(m[1], 'en')} account created yet`,
    ru: (m) => `Аккаунт для роли «${translateUiText(m[1], 'ru')}» ещё не создан`,
  },
  {
    regex: /^Davom etish\s*\((.+)\)$/i,
    en: (m) => `Continue (${translateUiText(m[1], 'en')})`,
    ru: (m) => `Продолжить (${translateUiText(m[1], 'ru')})`,
  },
  {
    regex: /^Bu raqam bilan\s+(.+)\s+akkaunti allaqachon yaratilgan\.$/i,
    en: (m) => `A ${translateUiText(m[1], 'en')} account with this number already exists.`,
    ru: (m) => `Аккаунт (${translateUiText(m[1], 'ru')}) с этим номером уже существует.`,
  },
  {
    regex: /^Bu raqam bo'yicha\s+(.+)\s+akkaunti topilmadi\. Avval akkaunt yarating\.$/i,
    en: (m) => `No ${translateUiText(m[1], 'en')} account found for this number. Please create an account first.`,
    ru: (m) => `Аккаунт (${translateUiText(m[1], 'ru')}) по этому номеру не найден. Сначала создайте аккаунт.`,
  },
  {
    regex: /^Bu raqam va rol\s*\((.+)\)\s*bilan boshqa akkaunt allaqachon mavjud\.$/i,
    en: (m) => `Another account with this number and role (${translateUiText(m[1], 'en')}) already exists.`,
    ru: (m) => `Другой аккаунт с этим номером и ролью (${translateUiText(m[1], 'ru')}) уже существует.`,
  },
  {
    regex: /^JShShIR aynan 14 ta raqam bo'lishi shart \(hozirda (\d+) ta\)$/i,
    en: (m) => `PINFL must be exactly 14 digits (currently ${m[1]})`,
    ru: (m) => `ПИНФЛ должен содержать ровно 14 цифр (сейчас ${m[1]})`,
  },

  // === Waiter Calls & Escalation (1st/2nd waiter-only, 3rd+ Admin escalation) ===
  {
    regex: /^Admin Eskalatsiyasi\s*•\s*(\d+)-marta chaqiruv$/i,
    en: (m) => `Admin Escalation • Call #${m[1]}`,
    ru: (m) => `Эскалация админу • Вызов №${m[1]}`,
  },
  {
    regex: /^Admin Eskalatsiyasi\s*\((\d+)x\)$/i,
    en: (m) => `Admin Escalation (${m[1]}x)`,
    ru: (m) => `Эскалация админу (${m[1]}x)`,
  },
  {
    regex: /^Admin xabardor\s*\((\d+)x\)$/i,
    en: (m) => `Admin Alerted (${m[1]}x)`,
    ru: (m) => `Админ уведомлён (${m[1]}x)`,
  },
  {
    regex: /^Adminga xabar\s*\((\d+)x\)$/i,
    en: (m) => `Admin Alerted (${m[1]}x)`,
    ru: (m) => `Админ уведомлён (${m[1]}x)`,
  },
  {
    regex: /^Qayta chaqiruv\s*\((\d+)x\)$/i,
    en: (m) => `Recall (${m[1]}x)`,
    ru: (m) => `Повторный вызов (${m[1]}x)`,
  },
  {
    regex: /^Qayta chaqiruv\s*\((\d+)-marta\):\s*Stol №(\d+)$/i,
    en: (m) => `Recall (#${m[1]}): Table #${m[2]}`,
    ru: (m) => `Повторный вызов (${m[1]}-й раз): Стол №${m[2]}`,
  },
  {
    regex: /^SHOSHILINCH\s*\((\d+)-marta\):\s*Stol №(\d+)$/i,
    en: (m) => `URGENT (Call #${m[1]}): Table #${m[2]}`,
    ru: (m) => `СРОЧНО (${m[1]}-й вызов): Стол №${m[2]}`,
  },
  {
    regex: /^Ofitsiant kelmadi!\s*Stol №(\d+)\s*\((\d+)-marta chaqiruv\)$/i,
    en: (m) => `Waiter didn't arrive! Table #${m[1]} (Call #${m[2]})`,
    ru: (m) => `Официант не подошёл! Стол №${m[1]} (Вызов №${m[2]})`,
  },
  {
    regex: /^Stol №(\d+)\s+ga ofitsiant bormadi!$/i,
    en: (m) => `Waiter did not attend Table #${m[1]}!`,
    ru: (m) => `Официант не подошёл к столу №${m[1]}!`,
  },
  {
    regex: /^(\d+)-marta chaqiruv\s*•\s*Adminga xabar ketdi!$/i,
    en: (m) => `Call #${m[1]} • Admin Alerted!`,
    ru: (m) => `Вызов №${m[1]} • Админ уведомлён!`,
  },
  {
    regex: /^Mijoz (\d+)-marta chaqirmoqda!\s*Kechikish haqida Adminga ham xabar yuborildi!$/i,
    en: (m) => `Guest is calling for the #${m[1]} time! Admin has also been notified of the delay!`,
    ru: (m) => `Клиент вызывает в ${m[1]}-й раз! Администратор также уведомлён о задержке!`,
  },
  {
    regex: /^Mijoz (\d+)-marta ofitsiantni chaqirmoqda\s*\(Ofitsiant kelmadi!\)$/i,
    en: (m) => `Guest calling waiter (#${m[1]}) — Waiter did not arrive!`,
    ru: (m) => `Клиент вызывает официанта (${m[1]}-й раз) — Официант не подошёл!`,
  },
  {
    regex: /^Ofitsiant qayta chaqirildi\s*\((\d+)-marta\)$/i,
    en: (m) => `Waiter recalled (Call #${m[1]})`,
    ru: (m) => `Официант вызван повторно (${m[1]}-й раз)`,
  },
  {
    regex: /^(.+)\s+ekraniga qayta xabar yuborildi\. 3-chaqiruvda administratorga xabar boradi\.$/i,
    en: (m) => `2nd alert sent to ${m[1]}'s screen. Admin will be notified on the 3rd call.`,
    ru: (m) => `Повторное уведомление отправлено на экран ${m[1]}. На 3-й вызов уведомим админа.`,
  },
  {
    regex: /^(.+)\s+ekraniga real vaqtda xabar yuborildi\.$/i,
    en: (m) => `Real-time alert sent to ${m[1]}'s screen.`,
    ru: (m) => `Уведомление отправлено на экран ${m[1]} в реальном времени.`,
  },
  {
    regex: /^(.+)\s+hozir stolingizga kelmoqda\.$/i,
    en: (m) => `${m[1]} is on the way to your table now.`,
    ru: (m) => `${m[1]} уже идёт к вашему столу.`,
  },
  {
    regex: /^Mas'ul:\s*(.+?)\s+javob bermadi\.\s*(.+)$/i,
    en: (m) => `Assigned: ${m[1]} did not respond. ${translateUiText(m[2], 'en')}`,
    ru: (m) => `Ответственный: ${m[1]} не ответил. ${translateUiText(m[2], 'ru')}`,
  },
  {
    regex: /^Hisob so'raldi:\s*Stol №(\d+)$/i,
    en: (m) => `Bill Requested: Table #${m[1]}`,
    ru: (m) => `Запрос счёта: Стол №${m[1]}`,
  },
  {
    regex: /^Ofitsiant chaqiruvi:\s*Stol №(\d+)$/i,
    en: (m) => `Waiter Call: Table #${m[1]}`,
    ru: (m) => `Вызов официанта: Стол №${m[1]}`,
  },
  {
    regex: /^Stol №(\d+)\s+chaqiruvi admin tomonidan yopildi\.$/i,
    en: (m) => `Table #${m[1]} call was resolved by admin.`,
    ru: (m) => `Вызов стола №${m[1]} закрыт администратором.`,
  },
  {
    regex: /^Stol №(\d+)\s+chaqiruvi bajarildi\.$/i,
    en: (m) => `Table #${m[1]} call resolved.`,
    ru: (m) => `Вызов стола №${m[1]} выполнен.`,
  },
  {
    regex: /^Stol №(\d+)\s+hisob varaqasi uchun ofitsiant kelmoqda\.$/i,
    en: (m) => `Waiter is coming with the bill for Table #${m[1]}.`,
    ru: (m) => `Официант несёт счёт к столу №${m[1]}.`,
  },
  {
    regex: /^Stol №(\d+)\s+to'lov hisob varaqasini so'radi\.$/i,
    en: (m) => `Table #${m[1]} requested the bill.`,
    ru: (m) => `Стол №${m[1]} запросил счёт к оплате.`,
  },
  {
    regex: /^Stol №(\d+)\s+da mijoz sizni kutmoqda\.$/i,
    en: (m) => `A guest at Table #${m[1]} is waiting for you.`,
    ru: (m) => `Гость за столом №${m[1]} ждёт вас.`,
  },
  {
    regex: /^Stol №(\d+)\s+da mijoz ofitsiantni kutmoqda$/i,
    en: (m) => `A guest at Table #${m[1]} is waiting for a waiter`,
    ru: (m) => `Гость за столом №${m[1]} ждёт официанта`,
  },
  {
    regex: /^Chaqirildi\s*\((\d+)x\)$/i,
    en: (m) => `Called (${m[1]}x)`,
    ru: (m) => `Вызван (${m[1]}x)`,
  },
  {
    regex: /^Chaqiruv\s*\((\d+)x\)$/i,
    en: (m) => `Call (${m[1]}x)`,
    ru: (m) => `Вызов (${m[1]}x)`,
  },

  // === Admin Customers & Accounts ===
  {
    regex: /^Mijozlar\s*\((\d+)\)$/i,
    en: (m) => `Customers (${m[1]})`,
    ru: (m) => `Клиенты (${m[1]})`,
  },
  {
    regex: /^Bugun qo'shilgan:\s*\+(\d+)$/i,
    en: (m) => `Joined today: +${m[1]}`,
    ru: (m) => `Присоединились сегодня: +${m[1]}`,
  },
  {
    regex: /^Har bir buyurtmadan\s+(\d+%)\s+keshbek$/i,
    en: (m) => `${m[1]} cashback on every order`,
    ru: (m) => `Кешбэк ${m[1]} с каждого заказа`,
  },
  {
    regex: /^Jami buyurtmalar:\s*(\d+)\s*ta$/i,
    en: (m) => `Total orders: ${m[1]}`,
    ru: (m) => `Всего заказов: ${m[1]}`,
  },
  {
    regex: /^(\d+)\s+ta mijoz ma'lumoti eksport qilindi\.$/i,
    en: (m) => `Exported ${m[1]} customer records.`,
    ru: (m) => `Экспортировано данных клиентов: ${m[1]}.`,
  },
  {
    regex: /^(.+?)\s*·\s*Qo'shilgan:\s*(.+)$/i,
    en: (m) => `${m[1]} · Joined: ${m[2]}`,
    ru: (m) => `${m[1]} · Регистрация: ${m[2]}`,
  },

  // === Order Notifications & Table Status Toasts ===
  {
    regex: /^🔔\s*Yangi buyurtma:\s*Stol №(\d+)$/i,
    en: (m) => `🔔 New Order: Table #${m[1]}`,
    ru: (m) => `🔔 Новый заказ: Стол №${m[1]}`,
  },
  {
    regex: /^Yangi buyurtma:\s*Stol №(\d+)$/i,
    en: (m) => `New Order: Table #${m[1]}`,
    ru: (m) => `Новый заказ: Стол №${m[1]}`,
  },
  {
    regex: /^Taom tayyor:\s*Stol №(\d+)$/i,
    en: (m) => `Dish Ready: Table #${m[1]}`,
    ru: (m) => `Блюдо готово: Стол №${m[1]}`,
  },
  {
    regex: /^Oshxona boshladi:\s*Stol №(\d+)$/i,
    en: (m) => `Kitchen Started: Table #${m[1]}`,
    ru: (m) => `Кухня начала готовить: Стол №${m[1]}`,
  },
  {
    regex: /^Stol №(\d+)\s+bo'shatildi$/i,
    en: (m) => `Table #${m[1]} freed`,
    ru: (m) => `Стол №${m[1]} освобождён`,
  },
  {
    regex: /^Yangi holat:\s*(.+)$/i,
    en: (m) => `New status: ${translateUiText(m[1], 'en')}`,
    ru: (m) => `Новый статус: ${translateUiText(m[1], 'ru')}`,
  },
  {
    regex: /^Stol №(\d+)\s+mehmoni$/i,
    en: (m) => `Guest at Table #${m[1]}`,
    ru: (m) => `Гость стола №${m[1]}`,
  },
  {
    regex: /^Stol №(\d+)\s+avtomatik aniqlandi!$/i,
    en: (m) => `Table #${m[1]} detected automatically!`,
    ru: (m) => `Стол №${m[1]} определён автоматически!`,
  },
  {
    regex: /^QR-kod muvaffaqiyatli o'qildi\. Siz №(\d+)-stol menyusidasiz\.$/i,
    en: (m) => `QR code scanned successfully. You are viewing Table #${m[1]}'s menu.`,
    ru: (m) => `QR-код успешно считан. Вы в меню стола №${m[1]}.`,
  },
  {
    regex: /^Stol №(\d+)\s+QR havolasi nusxalandi\.$/i,
    en: (m) => `Table #${m[1]} QR link copied.`,
    ru: (m) => `QR-ссылка стола №${m[1]} скопирована.`,
  },
  {
    regex: /^Stol №(\d+)\s+uchun haqiqiy skanerlanadigan PNG QR-karta yuklandi\.$/i,
    en: (m) => `Scannable PNG QR card downloaded for Table #${m[1]}.`,
    ru: (m) => `Сканируемая PNG QR-карта для стола №${m[1]} скачана.`,
  },
  {
    regex: /^Barcha stol QR kodlari (.+) manziliga ulandi\.$/i,
    en: (m) => `All table QR codes linked to ${m[1]}.`,
    ru: (m) => `Все QR-коды столов привязаны к ${m[1]}.`,
  },

  // === Tables & Zones ===
  {
    regex: /^Oddiy Stol №(\d+)$/i,
    en: (m) => `Standard Table #${m[1]}`,
    ru: (m) => `Обычный стол №${m[1]}`,
  },
  {
    regex: /^Biznes Stol №(\d+)$/i,
    en: (m) => `Business Table #${m[1]}`,
    ru: (m) => `Бизнес стол №${m[1]}`,
  },
  {
    regex: /^VIP Stol №(\d+)$/i,
    en: (m) => `VIP Table #${m[1]}`,
    ru: (m) => `VIP стол №${m[1]}`,
  },
  {
    regex: /^Stol №\s*(\d+)$/i,
    en: (m) => `Table #${m[1]}`,
    ru: (m) => `Стол №${m[1]}`,
  },
  {
    regex: /^·\s*Stol №(\d+)$/i,
    en: (m) => `· Table #${m[1]}`,
    ru: (m) => `· Стол №${m[1]}`,
  },
  {
    regex: /^Stol (\d+)$/i,
    en: (m) => `Table ${m[1]}`,
    ru: (m) => `Стол ${m[1]}`,
  },
  {
    regex: /^Menyuga qaytish\s*\(Stol №(\d+)\)$/i,
    en: (m) => `Back to Menu (Table #${m[1]})`,
    ru: (m) => `Вернуться в меню (Стол №${m[1]})`,
  },
  {
    regex: /^Joriy tashrif buyurtmalari\s*\(Stol №(\d+)\)$/i,
    en: (m) => `Current Visit Orders (Table #${m[1]})`,
    ru: (m) => `Заказы текущего визита (Стол №${m[1]})`,
  },
  {
    regex: /^Har bir taomga alohida talabnoma yozishingiz mumkin\s*·\s*Stol №(\d+)$/i,
    en: (m) => `You can add a special note for each dish · Table #${m[1]}`,
    ru: (m) => `Вы можете добавить пожелание к каждому блюду · Стол №${m[1]}`,
  },
  {
    regex: /^Buyurtma berish\s*·\s*(.+)$/i,
    en: (m) => `Place Order · ${translateMoneyInline(m[1], 'en')}`,
    ru: (m) => `Оформить заказ · ${translateMoneyInline(m[1], 'ru')}`,
  },
  {
    regex: /^Keshbekdan foydalanish\s*\((.+)\)$/i,
    en: (m) => `Use Cashback (${m[1]})`,
    ru: (m) => `Использовать кешбэк (${m[1]})`,
  },
  {
    regex: /^Keyingi daraja:\s*(.+)$/i,
    en: (m) => `Next tier: ${translateUiText(m[1], 'en')}`,
    ru: (m) => `Следующий уровень: ${translateUiText(m[1], 'ru')}`,
  },
  {
    regex: /^Yana\s+(.+)$/i,
    en: (m) => `${translateMoneyInline(m[1], 'en')} more`,
    ru: (m) => `Ещё ${translateMoneyInline(m[1], 'ru')}`,
  },
  {
    regex: /^Ishlatildi:\s*(.+)$/i,
    en: (m) => `Used: ${translateMoneyInline(m[1], 'en')}`,
    ru: (m) => `Использовано: ${translateMoneyInline(m[1], 'ru')}`,
  },
  {
    regex: /^Kutilmoqda:\s*(.+)$/i,
    en: (m) => `Pending: ${translateMoneyInline(m[1], 'en')}`,
    ru: (m) => `Ожидается: ${translateMoneyInline(m[1], 'ru')}`,
  },
  {
    regex: /^\+(.+?)\s+keshbek\s*\((.+)\)$/i,
    en: (m) => `+${translateMoneyInline(m[1], 'en')} cashback (${m[2]})`,
    ru: (m) => `+${translateMoneyInline(m[1], 'ru')} кешбэк (${m[2]})`,
  },
  {
    regex: /^Real vaqt\s*·\s*(.+)$/i,
    en: (m) => `Live Time · ${m[1]}`,
    ru: (m) => `Реальное время · ${m[1]}`,
  },
  {
    regex: /^Xohlasangiz kabinet oching \(\+(.+) bonus\) yoki mehmon sifatida davom eting\.$/i,
    en: (m) => `Create an account (+${translateMoneyInline(m[1], 'en')} bonus) or continue as a guest.`,
    ru: (m) => `Откройте кабинет (+${translateMoneyInline(m[1], 'ru')} бонус) или продолжите как гость.`,
  },
  {
    regex: /^“(.+)”\s+uchun talabnoma:$/i,
    en: (m) => `Note for "${m[1]}":`,
    ru: (m) => `Пожелание к «${m[1]}»:`,
  },
  {
    regex: /^"(.+)"\s+uchun talabnoma:$/i,
    en: (m) => `Note for "${m[1]}":`,
    ru: (m) => `Пожелание к «${m[1]}»:`,
  },

  // === Counts, Chips, Tabs & Filters ===
  {
    regex: /^Barcha buyurtmalar tarixi\s*\((\d+)\)$/i,
    en: (m) => `All Order History (${m[1]})`,
    ru: (m) => `Вся история заказов (${m[1]})`,
  },
  {
    regex: /^Joriy chek buyurtmalari\s*\((\d+)\)$/i,
    en: (m) => `Current Bill Orders (${m[1]})`,
    ru: (m) => `Заказы текущего счёта (${m[1]})`,
  },
  {
    regex: /^Buyurtma tarixi\s*\((\d+)\)$/i,
    en: (m) => `Order History (${m[1]})`,
    ru: (m) => `История заказов (${m[1]})`,
  },
  {
    regex: /^Keshbek tarixi\s*\((\d+)\)$/i,
    en: (m) => `Cashback History (${m[1]})`,
    ru: (m) => `История кешбэка (${m[1]})`,
  },
  {
    regex: /^Barchasi\s*\((\d+)\s*stol\)$/i,
    en: (m) => `All (${m[1]} tables)`,
    ru: (m) => `Все (${m[1]} ст.)`,
  },
  {
    regex: /^Barchasi\s*\(([\d\s,.]+)\s*so['’‘ʻ`]?m\)$/i,
    en: (m) => `All (${m[1].trim()} UZS)`,
    ru: (m) => `Всё (${m[1].trim()} сум)`,
  },
  {
    regex: /^Barchasi\s*\((\d+)\)$/i,
    en: (m) => `All (${m[1]})`,
    ru: (m) => `Все (${m[1]})`,
  },
  {
    regex: /^(Faol|Olindi|Bekor|Oddiy|Biznes|VIP|Bo'sh|Band|Chaqiruv|Chek berilgan|Admin|Ofitsiant|Oshpaz|Yangi|Tayyor|Ofitsiantlar)\s*\((\d+)\)$/i,
    en: (m) => `${translateUiText(m[1], 'en')} (${m[2]})`,
    ru: (m) => `${translateUiText(m[1], 'ru')} (${m[2]})`,
  },
  {
    regex: /^Barcha biriktirilgan stollar\s*\((\d+)\s*ta\)$/i,
    en: (m) => `All assigned tables (${m[1]})`,
    ru: (m) => `Все закреплённые столы (${m[1]})`,
  },
  {
    regex: /^Sizga biriktirilgan stollar\s*\((\d+)(?:\s*ta)?\)(:?)$/i,
    en: (m) => `Your assigned tables (${m[1]})${m[2]}`,
    ru: (m) => `Закреплённые за вами столы (${m[1]})${m[2]}`,
  },
  {
    regex: /^Tayyor\s*\(Olib chiqish\)\s*\((\d+)\)$/i,
    en: (m) => `Ready (To Serve) (${m[1]})`,
    ru: (m) => `Готово (Подать) (${m[1]})`,
  },
  {
    regex: /^Yangi:\s*(\d+)$/i,
    en: (m) => `New: ${m[1]}`,
    ru: (m) => `Новые: ${m[1]}`,
  },
  {
    regex: /^Oshxonada:\s*(\d+)$/i,
    en: (m) => `Cooking: ${m[1]}`,
    ru: (m) => `На кухне: ${m[1]}`,
  },
  {
    regex: /^Tayyor:\s*(\d+)$/i,
    en: (m) => `Ready: ${m[1]}`,
    ru: (m) => `Готово: ${m[1]}`,
  },
  {
    regex: /^Kechikkanlarni filtrlash\s*\((\d+)\)$/i,
    en: (m) => `Filter Delayed (${m[1]})`,
    ru: (m) => `Фильтр задержек (${m[1]})`,
  },
  {
    regex: /^Barcha kategoriyalar\s*\((\d+)\)$/i,
    en: (m) => `All Categories (${m[1]})`,
    ru: (m) => `Все категории (${m[1]})`,
  },
  {
    regex: /^Barcha stollar\s*\((\d+)\s*ta\)$/i,
    en: (m) => `All Tables (${m[1]})`,
    ru: (m) => `Все столы (${m[1]})`,
  },

  // === Units, Time & Currency ===
  {
    regex: /^(\d+)\s+o['’‘ʻ`]?rinli$/i,
    en: (m) => `${m[1]} seats`,
    ru: (m) => `${m[1]} мест`,
  },
  {
    regex: /^(\d+)\s+daqiqa oldin$/i,
    en: (m) => `${m[1]} min ago`,
    ru: (m) => `${m[1]} мин назад`,
  },
  {
    regex: /^(\d+)s\s+(\d+)\s+daq$/i,
    en: (m) => `${m[1]}h ${m[2]}m`,
    ru: (m) => `${m[1]}ч ${m[2]}м`,
  },
  {
    regex: /^(\d+)\s+daq$/i,
    en: (m) => `${m[1]} min`,
    ru: (m) => `${m[1]} мин`,
  },
  {
    regex: /^(\d+)\s+daqiqa$/i,
    en: (m) => `${m[1]} min`,
    ru: (m) => `${m[1]} мин`,
  },
  {
    regex: /^(\d+)\s+dona$/i,
    en: (m) => `${m[1]} pcs`,
    ru: (m) => `${m[1]} шт`,
  },
  {
    regex: /^(\d+)\s+ta stol$/i,
    en: (m) => `${m[1]} tables`,
    ru: (m) => `${m[1]} столов`,
  },
  {
    regex: /^(\d+)\s+ta baho$/i,
    en: (m) => `${m[1]} reviews`,
    ru: (m) => `${m[1]} отзывов`,
  },
  {
    regex: /^(\d+)\s+ta buyurtma$/i,
    en: (m) => `${m[1]} orders`,
    ru: (m) => `${m[1]} заказов`,
  },
  {
    regex: /^(\d+)\s+ta chek$/i,
    en: (m) => `${m[1]} receipts`,
    ru: (m) => `${m[1]} чеков`,
  },
  {
    regex: /^(\d+)\s+ta taom$/i,
    en: (m) => `${m[1]} dishes`,
    ru: (m) => `${m[1]} блюд`,
  },
  {
    regex: /^(\d+)\s+ta kechikmoqda!$/i,
    en: (m) => `${m[1]} delayed!`,
    ru: (m) => `${m[1]} с задержкой!`,
  },
  {
    regex: /^(\d+)\s+ta kechikkan chaqiruv$/i,
    en: (m) => `${m[1]} escalated calls`,
    ru: (m) => `${m[1]} просроч. вызовов`,
  },
  {
    regex: /^(\d+)\s+ta$/i,
    en: (m) => `${m[1]}`,
    ru: (m) => `${m[1]} шт`,
  },
  {
    regex: /^([\d\s,.]+)\s*so['’‘ʻ`]?m\s*\/\s*dona$/i,
    en: (m) => `${m[1].trim()} UZS / pc`,
    ru: (m) => `${m[1].trim()} сум / шт`,
  },
  {
    regex: /^([+-]?[\d\s,.]+)\s*so['’‘ʻ`]?m$/i,
    en: (m) => `${m[1].trim()} UZS`,
    ru: (m) => `${m[1].trim()} сум`,
  },
  {
    regex: /^Jami:\s*([\d\s,.]+)\s*so['’‘ʻ`]?m$/i,
    en: (m) => `Total: ${m[1].trim()} UZS`,
    ru: (m) => `Итого: ${m[1].trim()} сум`,
  },

  // === Analytics Summaries & Charts ===
  {
    regex: /^Bugungi tushum:\s*(.+?)\s*\((\d+)\s*ta buyurtma,\s*(.+)\)$/i,
    en: (m) => `Today's revenue: ${translateMoneyInline(m[1], 'en')} (${m[2]} orders, ${m[3]})`,
    ru: (m) => `Выручка за сегодня: ${translateMoneyInline(m[1], 'ru')} (${m[2]} заказов, ${m[3]})`,
  },
  {
    regex: /^Tushlik piki:\s*(.+?)\s*\((.+?),\s*(\d+)\s*ta chek\)$/i,
    en: (m) => `Lunch peak: ${m[1]} (${translateMoneyInline(m[2], 'en')}, ${m[3]} checks)`,
    ru: (m) => `Обеденный пик: ${m[1]} (${translateMoneyInline(m[2], 'ru')}, ${m[3]} чеков)`,
  },
  {
    regex: /^Kechki pik:\s*(.+?)\s*\((.+?),\s*(\d+)\s*ta chek\)$/i,
    en: (m) => `Dinner peak: ${m[1]} (${translateMoneyInline(m[2], 'en')}, ${m[3]} checks)`,
    ru: (m) => `Вечерний пик: ${m[1]} (${translateMoneyInline(m[2], 'ru')}, ${m[3]} чеков)`,
  },
  {
    regex: /^Oxirgi (\d+) kunlik umumiy tushum:\s*(.+?)\s*\((\d+)\s*ta buyurtma\)$/i,
    en: (m) => `Last ${m[1]} days total revenue: ${translateMoneyInline(m[2], 'en')} (${m[3]} orders)`,
    ru: (m) => `Общая выручка за последние ${m[1]} дней: ${translateMoneyInline(m[2], 'ru')} (${m[3]} заказов)`,
  },
  {
    regex: /^Oxirgi 30 kunlik jami tushum:\s*(.+?)\s*\((\d+)\s*ta chek\)$/i,
    en: (m) => `Last 30 days total revenue: ${translateMoneyInline(m[1], 'en')} (${m[2]} receipts)`,
    ru: (m) => `Общая выручка за 30 дней: ${translateMoneyInline(m[1], 'ru')} (${m[2]} чеков)`,
  },
  {
    regex: /^Eng yuqori tushumli kun:\s*(.+?)\s*\((.+)\)$/i,
    en: (m) => `Top revenue day: ${translateUiText(m[1], 'en')} (${translateMoneyInline(m[2], 'en')})`,
    ru: (m) => `Самый прибыльный день: ${translateUiText(m[1], 'ru')} (${translateMoneyInline(m[2], 'ru')})`,
  },
  {
    regex: /^Dekadadagi eng sermahsul kun:\s*(.+?)\s*\((.+)\)$/i,
    en: (m) => `Top day in 10-day period: ${translateUiText(m[1], 'en')} (${translateMoneyInline(m[2], 'en')})`,
    ru: (m) => `Самый продуктивный день декады: ${translateUiText(m[1], 'ru')} (${translateMoneyInline(m[2], 'ru')})`,
  },
  {
    regex: /^Oylik o'rtacha kunlik savdo:\s*(.+)$/i,
    en: (m) => `Monthly daily avg sales: ${translateMoneyInline(m[1], 'en')}`,
    ru: (m) => `Среднедневная выручка за месяц: ${translateMoneyInline(m[1], 'ru')}`,
  },
  {
    regex: /^Bugun\s*\((\d+)-([A-Za-z]+)\)$/i,
    en: (m) => `Today (${m[1]} ${translateMonthAbbr(m[2], 'en')})`,
    ru: (m) => `Сегодня (${m[1]} ${translateMonthAbbr(m[2], 'ru')})`,
  },
  {
    regex: /^Bugun\s*\((\d+)\)$/i,
    en: (m) => `Today (${m[1]})`,
    ru: (m) => `Сегодня (${m[1]})`,
  },
  {
    regex: /^(\d+)-([A-Za-z]{3,4})$/i,
    en: (m) => `${m[1]} ${translateMonthAbbr(m[2], 'en')}`,
    ru: (m) => `${m[1]} ${translateMonthAbbr(m[2], 'ru')}`,
  },
  {
    regex: /^Keyingi:\s*(.+?)\s*\((.+)\)$/i,
    en: (m) => `Next: ${translateUiText(m[1], 'en')} (${m[2]})`,
    ru: (m) => `Далее: ${translateUiText(m[1], 'ru')} (${m[2]})`,
  },
  {
    regex: /^Soat:\s*(.+)$/i,
    en: (m) => `Hour: ${m[1]}`,
    ru: (m) => `Час: ${m[1]}`,
  },
  {
    regex: /^Tanlangan soat:\s*(.+)$/i,
    en: (m) => `Selected hour: ${m[1]}`,
    ru: (m) => `Выбранный час: ${m[1]}`,
  },
  {
    regex: /^Dekada kuni:\s*(.+)$/i,
    en: (m) => `Decade day: ${translateUiText(m[1], 'en')}`,
    ru: (m) => `День декады: ${translateUiText(m[1], 'ru')}`,
  },
  {
    regex: /^Kun:\s*(.+)$/i,
    en: (m) => `Day: ${translateUiText(m[1], 'en')}`,
    ru: (m) => `День: ${translateUiText(m[1], 'ru')}`,
  },
  {
    regex: /^Davr:\s*(.+)$/i,
    en: (m) => `Period: ${translateUiText(m[1], 'en')}`,
    ru: (m) => `Период: ${translateUiText(m[1], 'ru')}`,
  },
  {
    regex: /^Faqat\s+(.+)\s+dagi tushum va xaridorgir taomlar$/i,
    en: (m) => `Revenue & top dishes for ${m[1]} only`,
    ru: (m) => `Выручка и популярные блюда только за ${m[1]}`,
  },
  {
    regex: /^Soat\s+(.+)\s+dagi buyurtmalar tahlili$/i,
    en: (m) => `Orders breakdown for ${m[1]}`,
    ru: (m) => `Анализ заказов за ${m[1]}`,
  },
  {
    regex: /^Oshxona me'yori:\s*(\d+)\s*daq$/i,
    en: (m) => `Kitchen norm: ${m[1]} min`,
    ru: (m) => `Норма кухни: ${m[1]} мин`,
  },
  {
    regex: /^Bu taomga (\d+) ta mehmon baho bergan$/i,
    en: (m) => `${m[1]} guests rated this dish`,
    ru: (m) => `${m[1]} гостей оценили это блюдо`,
  },
  {
    regex: /^Umumiy xizmat\s*\((.+)\)$/i,
    en: (m) => `Overall Service (${m[1]})`,
    ru: (m) => `Общий сервис (${m[1]})`,
  },
  {
    regex: /^(Diqqat talab|Bronza Daraja|Kumush Daraja|Oltin Daraja|Oliy Daraja)\s*\((\d+\/\d+)\)$/i,
    en: (m) => `${translateUiText(m[1], 'en')} (${m[2]})`,
    ru: (m) => `${translateUiText(m[1], 'ru')} (${m[2]})`,
  },
  {
    regex: /^"(.+)"\s+\((.+)\)\s+muvaffaqiyatli yangilandi\.$/i,
    en: (m) => `"${m[1]}" (${m[2]}) updated successfully.`,
    ru: (m) => `«${m[1]}» (${m[2]}) успешно обновлено.`,
  },
  {
    regex: /^"(.+)"\s+menyudan olib tashlandi\.$/i,
    en: (m) => `"${m[1]}" removed from menu.`,
    ru: (m) => `«${m[1]}» удалено из меню.`,
  },
  {
    regex: /^"(.+)"\s+(mavjud|tugagan)\s+deb belgilandi\.$/i,
    en: (m) => `"${m[1]}" marked as ${m[2].toLowerCase() === 'mavjud' ? 'available' : 'sold out'}.`,
    ru: (m) => `«${m[1]}» отмечено как ${m[2].toLowerCase() === 'mavjud' ? 'в наличии' : 'нет в наличии'}.`,
  },
  {
    regex: /^"(.+)"\s+yaratildi\.$/i,
    en: (m) => `"${m[1]}" created.`,
    ru: (m) => `«${m[1]}» создано.`,
  },
  {
    regex: /^"(.+)"\s+hozirda mavjud emas\.$/i,
    en: (m) => `"${m[1]}" is currently out of stock.`,
    ru: (m) => `«${m[1]}» сейчас нет в наличии.`,
  },
  {
    regex: /^"(.+)"\s+nomi va zamonaviy logotipi tizimda saqlandi\.$/i,
    en: (m) => `"${m[1]}" name and logo saved to system.`,
    ru: (m) => `Название «${m[1]}» и логотип сохранены в системе.`,
  },
];

// Inline phrase & word replacements for compound sentences (longest phrases first!)
const INLINE_REPLACEMENTS: Array<[RegExp, string, string]> = [
  [/so['’‘ʻ`]?m\b/gi, 'UZS', 'сум'],
  [/\bStol №\s*(\d+)/gi, 'Table #$1', 'Стол №$1'],
  [/\bOddiy Stol\b/gi, 'Standard Table', 'Обычный стол'],
  [/\bBiznes Stol\b/gi, 'Business Table', 'Бизнес стол'],
  [/\bOliy Daraja\b/gi, 'Platinum Level', 'Высший уровень'],
  [/\bOltin Daraja\b/gi, 'Gold Level', 'Золотой уровень'],
  [/\bKumush Daraja\b/gi, 'Silver Level', 'Серебряный уровень'],
  [/\bBronza Daraja\b/gi, 'Bronze Level', 'Бронзовый уровень'],
  [/\bDiqqat talab\b/gi, 'Needs Attention', 'Требует внимания'],
  [/\bShaxsiy kabinet\b/gi, 'Personal Account', 'Личный кабинет'],
  [/\bMehmon rejimi\b/gi, 'Guest Mode', 'Гостевой режим'],
  [/\bkeshbek faol\b/gi, 'cashback active', 'кешбэк активен'],
  [/\bkeshbek yig['’‘ʻ`]?iladi\b/gi, 'cashback earned', 'начисляется кешбэк'],
  [/\bAkkaunt ochsangiz\b/gi, 'Create an account to earn', 'Создайте аккаунт и получайте'],
  [/\bBuyurtmalar tarixi\b/gi, 'Order History', 'История заказов'],
  [/\bBuyurtma raqami\b/gi, 'Order Number', 'Номер заказа'],
  [/\bYangi buyurtma\b/gi, 'New Order', 'Новый заказ'],
  [/\bBuyurtmalar\b/gi, 'Orders', 'Заказы'],
  [/\bBuyurtma\b/gi, 'Order', 'Заказ'],
  [/\bOfitsiantlar\b/gi, 'Waiters', 'Официанты'],
  [/\bOfitsiant\b/gi, 'Waiter', 'Официант'],
  [/\bOshpazlar\b/gi, 'Chefs', 'Повара'],
  [/\bOshpaz\b/gi, 'Chef', 'Повар'],
  [/\bOshxona\b/gi, 'Kitchen', 'Кухня'],
  [/\bAdministrator\b/gi, 'Administrator', 'Администратор'],
  [/\bMijozlar\b/gi, 'Customers', 'Клиенты'],
  [/\bMijoz\b/gi, 'Customer', 'Клиент'],
  [/\bTaomlar\b/gi, 'Dishes', 'Блюда'],
  [/\bTaom\b/gi, 'Dish', 'Блюдо'],
  [/\bStollar\b/gi, 'Tables', 'Столы'],
  [/\bKategoriyalar\b/gi, 'Categories', 'Категории'],
  [/\bKategoriya\b/gi, 'Category', 'Категория'],
  [/\bTushum\b/gi, 'Revenue', 'Выручка'],
  [/\bO['’‘ʻ`]?rtacha chek\b/gi, 'Avg Check', 'Средний чек'],
  [/\bReyting\b/gi, 'Rating', 'Рейтинг'],
  [/\bKeshbek\b/gi, 'Cashback', 'Кешбэк'],
  [/\bSavat\b/gi, 'Cart', 'Корзина'],
  [/\bMenyu\b/gi, 'Menu', 'Меню'],
  [/\bChek\b/gi, 'Receipt', 'Чек'],
  [/\bHozirgina\b/gi, 'Just now', 'Только что'],
  [/\bdaqiqa oldin\b/gi, 'min ago', 'мин назад'],
  [/\bdaqiqa\b/gi, 'min', 'мин'],
  [/\bdaq\b/gi, 'min', 'мин'],
  [/\bo['’‘ʻ`]?rinli\b/gi, 'seats', 'мест'],
  [/\bReal vaqt rejimi\b/gi, 'Live Mode', 'Режим реального времени'],
  [/\bToshkent Markaziy filiali\b/gi, 'Tashkent Central Branch', 'Центральный филиал Ташкента'],
  [/\bToshkent filiali\b/gi, 'Tashkent Branch', 'Ташкентский филиал'],
  [/\bChilonzor filiali\b/gi, 'Chilonzor Branch', 'Филиал Чиланзар'],
  [/\bToshkent\b/gi, 'Tashkent', 'Ташкент'],
  [/\bDaraja va Reyting\b/gi, 'Level & Rating', 'Уровень и Рейтинг'],
  [/\bDoimiy mehmon\b/gi, 'Regular Guest', 'Постоянный гость'],
  [/\bOltin mehmon\b/gi, 'Gold Guest', 'Золотой гость'],
  [/\bVIP mehmon\b/gi, 'VIP Guest', 'VIP гость'],
  [/\bAsosiy zal\b/gi, 'Main Hall', 'Основной зал'],
  [/\bVeranda\b/gi, 'Terrace', 'Веранда'],
  [/\bVIP xona\b/gi, 'VIP Room', 'VIP Комната'],
  [/\bDushanba\b/g, 'Monday', 'Понедельник'],
  [/\bSeshanba\b/g, 'Tuesday', 'Вторник'],
  [/\bChorshanba\b/g, 'Wednesday', 'Среда'],
  [/\bPayshanba\b/g, 'Thursday', 'Четверг'],
  [/\bJuma\b/g, 'Friday', 'Пятница'],
  [/\bShanba\b/g, 'Saturday', 'Суббота'],
  [/\bYakshanba\b/g, 'Sunday', 'Воскресенье'],
];

export function translateUiText(raw: string, lang: AppLanguage): string {
  if (!raw || lang === 'uz') return raw;

  // Preserve leading/trailing whitespace
  const leadingMatch = raw.match(/^\s*/);
  const trailingMatch = raw.match(/\s*$/);
  const leading = leadingMatch ? leadingMatch[0] : '';
  const trailing = trailingMatch ? trailingMatch[0] : '';
  const core = raw.trim();

  if (!core) return raw;
  // Skip pure numbers, times, phone numbers, URLs, order numbers (#DF-1234), badge IDs (OF-01)
  if (/^[+\d\s:.,/%#()-]+$/.test(core)) return raw;
  if (/^(https?:\/\/|\/|#[A-Z]+-\d+|OF-\d+|AD-\d+|OS-\d+)$/i.test(core)) return raw;

  const langIdx = lang === 'en' ? 0 : 1;
  const normCore = normalizeKey(core);

  // 1. Exact phrase lookup
  const exact = NORMALIZED_EXACT.get(normCore.toLowerCase());
  if (exact) {
    return `${leading}${exact[langIdx]}${trailing}`;
  }

  // 2. Regex pattern lookup
  for (const rule of REGEX_PATTERNS) {
    const match = normCore.match(rule.regex);
    if (match) {
      return `${leading}${lang === 'en' ? rule.en(match) : rule.ru(match)}${trailing}`;
    }
  }

  // 3. Dish / culinary exact or fallback translation
  let out = localizeCulinaryText(normCore, lang);

  // 4. Inline phrase replacements
  for (const [pattern, en, ru] of INLINE_REPLACEMENTS) {
    out = out.replace(pattern, lang === 'en' ? en : ru);
  }

  return `${leading}${out}${trailing}`;
}

// ============================================================================
// React-Safe DOM Auto-Translator Bridge
// Keeps WeakMap of original Uzbek strings so switching uz <-> en <-> ru never
// corrupts text or React reconciliation, and catches modals, toasts, charts & title.
// ============================================================================

interface TrackedText {
  original: string;
  applied: string;
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'] as const;

export class DomAutoTranslator {
  private lang: AppLanguage = 'uz';
  private textMap = new WeakMap<Text, TrackedText>();
  private attrMap = new WeakMap<Element, Record<string, TrackedText>>();
  private titleTracked: TrackedText | null = null;
  private observer: MutationObserver | null = null;
  private headObserver: MutationObserver | null = null;
  private isApplying = false;

  private isExcluded(node: Node | null): boolean {
    let curr: Node | null = node;
    while (curr) {
      if (curr.nodeType === Node.ELEMENT_NODE) {
        const el = curr as Element;
        if (SKIP_TAGS.has(el.tagName)) return true;
        if (el.getAttribute('data-no-translate') === 'true') return true;
      }
      curr = curr.parentNode;
    }
    return false;
  }

  private processDocumentTitle(): void {
    if (typeof document === 'undefined') return;
    const current = document.title || '';
    if (!current.trim()) return;

    if (this.lang === 'uz') {
      if (this.titleTracked && current === this.titleTracked.applied && this.titleTracked.original !== current) {
        document.title = this.titleTracked.original;
        this.titleTracked.applied = this.titleTracked.original;
      } else if (this.titleTracked && current !== this.titleTracked.applied) {
        this.titleTracked.original = current;
        this.titleTracked.applied = current;
      }
      return;
    }

    const original =
      this.titleTracked && current === this.titleTracked.applied ? this.titleTracked.original : current;
    const translated = translateUiText(original, this.lang);
    this.titleTracked = { original, applied: translated };
    if (translated !== current) {
      document.title = translated;
    }
  }

  private processTextNode(textNode: Text): void {
    if (this.isExcluded(textNode.parentNode)) return;
    const current = textNode.nodeValue ?? '';
    if (!current.trim()) return;

    const tracked = this.textMap.get(textNode);

    if (this.lang === 'uz') {
      if (tracked && current === tracked.applied && tracked.original !== current) {
        textNode.nodeValue = tracked.original;
        tracked.applied = tracked.original;
      } else if (tracked && current !== tracked.applied) {
        tracked.original = current;
        tracked.applied = current;
      }
      return;
    }

    // Active language is 'en' or 'ru'
    let original: string;
    if (!tracked) {
      original = current;
    } else if (current === tracked.applied) {
      original = tracked.original;
    } else {
      // React wrote a brand-new Uzbek string into this text node
      original = current;
    }

    const translated = translateUiText(original, this.lang);
    this.textMap.set(textNode, { original, applied: translated });
    if (translated !== current) {
      textNode.nodeValue = translated;
    }
  }

  private processElementAttrs(el: Element): void {
    if (this.isExcluded(el)) return;
    let record = this.attrMap.get(el);

    for (const attr of TRANSLATABLE_ATTRS) {
      const current = el.getAttribute(attr);
      if (current === null || !current.trim()) continue;

      if (!record) {
        record = {};
        this.attrMap.set(el, record);
      }

      const tracked = record[attr];
      if (this.lang === 'uz') {
        if (tracked && current === tracked.applied && tracked.original !== current) {
          el.setAttribute(attr, tracked.original);
          tracked.applied = tracked.original;
        } else if (tracked && current !== tracked.applied) {
          tracked.original = current;
          tracked.applied = current;
        }
        continue;
      }

      const original = tracked && current === tracked.applied ? tracked.original : current;
      const translated = translateUiText(original, this.lang);
      record[attr] = { original, applied: translated };
      if (translated !== current) {
        el.setAttribute(attr, translated);
      }
    }
  }

  private walk(root: Node): void {
    if (this.isExcluded(root)) return;

    if (root.nodeType === Node.TEXT_NODE) {
      this.processTextNode(root as Text);
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
      this.processElementAttrs(root as Element);
    }

    const children = root.childNodes;
    for (let i = 0; i < children.length; i++) {
      this.walk(children[i]);
    }
  }

  public setLanguage(nextLang: AppLanguage): void {
    this.lang = nextLang;
    if (typeof document === 'undefined' || !document.body) return;

    this.isApplying = true;
    try {
      this.processDocumentTitle();
      this.walk(document.body);
    } finally {
      this.isApplying = false;
    }

    if (nextLang === 'uz') {
      this.stopObserver();
    } else {
      this.startObserver();
    }
  }

  private startObserver(): void {
    if (typeof MutationObserver === 'undefined' || !document.body) return;

    if (!this.observer) {
      this.observer = new MutationObserver((mutations) => {
        if (this.isApplying || this.lang === 'uz') return;
        this.isApplying = true;
        try {
          for (const m of mutations) {
            if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
              this.processTextNode(m.target as Text);
            } else if (m.type === 'childList') {
              m.addedNodes.forEach((n) => this.walk(n));
            } else if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
              this.processElementAttrs(m.target as Element);
            }
          }
        } finally {
          this.isApplying = false;
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...TRANSLATABLE_ATTRS],
      });
    }

    if (!this.headObserver && document.head) {
      const titleEl = document.head.querySelector('title');
      if (titleEl) {
        this.headObserver = new MutationObserver(() => {
          if (this.isApplying || this.lang === 'uz') return;
          this.isApplying = true;
          try {
            this.processDocumentTitle();
          } finally {
            this.isApplying = false;
          }
        });
        this.headObserver.observe(titleEl, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      }
    }
  }

  private stopObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.headObserver) {
      this.headObserver.disconnect();
      this.headObserver = null;
    }
  }

  public destroy(): void {
    this.stopObserver();
  }
}
