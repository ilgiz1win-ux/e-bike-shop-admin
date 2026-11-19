// Sample data for the memory backend (local work and e2e tests only).
const DRIVERS = [
  ['d1', 'Иса', '996555123456', ['Lexus', 'LX600', 2022, 'green']],
  ['d2', 'Ахмед', '996700987654', ['Mercedes-Benz', 'W211', 2011, 'blue']],
  ['d3', 'Айгерим', '996550456789', ['Toyota', 'Camry', 2018, 'white']],
];
const ROUTES = [['Бишкек', 'Ош', 10, 1800], ['Бишкек', 'Чолпон-Ата', 4, 400], ['Бишкек', 'Нарын', 5, 600], ['Ош', 'Бишкек', 10, 1800]];

export function demoSeed(now = Date.now()) {
  const profiles = DRIVERS.map(([id, name, phone]) => ({ id, name, phone, lang: 'ky' }));
  const cars = DRIVERS.map(([id, , , [brand, model, year, color]]) => ({ id: 'c' + id, owner: id, brand, model, year, color, wheel: 'L' }));
  const trips = [];
  let k = 0;
  for (let day = 0; day < 3; day++) {
    ROUTES.forEach(([from, to, hours, price], i) => {
      const start = new Date(now + (day * 24 + 2 + i * 3) * 3600e3);
      const end = new Date(start.getTime() + hours * 3600e3);
      trips.push({ id: 't' + ++k, driver: DRIVERS[k % 3][0], from_city: from, to_city: to, starts_at: start.toISOString(), ends_at: end.toISOString(), seats: 4, price, takes_parcels: k % 2 === 0, parcel_price: Math.round(price / 2), payment: 'cash', comment: '' });
    });
  }
  return { profiles, cars, trips };
}
