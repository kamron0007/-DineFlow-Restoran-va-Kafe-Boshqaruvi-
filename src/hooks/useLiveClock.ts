import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AppLanguage } from '../i18n/types';

const MONTH_NAMES: Record<AppLanguage, string[]> = {
  uz: [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  ru: [
    'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
    'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря',
  ],
};

const WEEKDAY_NAMES: Record<AppLanguage, string[]> = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

export function useLiveClock() {
  const { language } = useLanguage();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds}`;

  const day = now.getDate();
  const monthName = MONTH_NAMES[language][now.getMonth()];
  const year = now.getFullYear();
  const weekday = WEEKDAY_NAMES[language][now.getDay()];

  const dateString =
    language === 'en'
      ? `${monthName} ${day}, ${year}`
      : language === 'ru'
      ? `${day} ${monthName}, ${year}`
      : `${day}-${monthName}, ${year}`;

  const shortDate =
    language === 'en'
      ? `${monthName} ${day}`
      : language === 'ru'
      ? `${day} ${monthName}`
      : `${day}-${monthName}`;

  return {
    now,
    timeString,
    dateString,
    shortDate,
    weekday,
    fullFormatted: `${shortDate} · ${timeString}`,
  };
}
