import { useState, useEffect } from 'react';

const MONTH_NAMES_UZ = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

const WEEKDAY_NAMES_UZ = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];

export function useLiveClock() {
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
  const monthName = MONTH_NAMES_UZ[now.getMonth()];
  const year = now.getFullYear();
  const weekday = WEEKDAY_NAMES_UZ[now.getDay()];

  const dateString = `${day}-${monthName}, ${year}`;
  const shortDate = `${day}-${monthName}`;

  return {
    now,
    timeString,
    dateString,
    shortDate,
    weekday,
    fullFormatted: `${shortDate} · ${timeString}`,
  };
}
