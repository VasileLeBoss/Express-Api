const { formatNextArrival } = require("./utils/nextArrival");

describe("formatNextArrival", () => {
  const fixedDate = new Date("2025-09-17T12:00:00"); // heure locale

  beforeAll(() => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test("headway = 3 → +3 minutes", () => {
    expect(formatNextArrival(fixedDate, 3)).toBe("12:03");
  });

  test("valeur par défaut → même résultat que headway = 3", () => {
    expect(formatNextArrival(fixedDate)).toBe("12:03");
  });

  test("headway invalide (≤0) → retourne null", () => {
    expect(formatNextArrival(fixedDate, 0)).toBeNull();
    expect(formatNextArrival(fixedDate, -5)).toBeNull();
    expect(formatNextArrival(fixedDate, "abc")).toBeNull();
  });
});
