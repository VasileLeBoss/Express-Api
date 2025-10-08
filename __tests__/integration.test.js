const request = require("supertest");
const { app } = require("../server"); 

describe("Integration tests - last-metro & next-metro", () => {
  // /last-metro
  describe("GET /last-metro", () => {
    test("200 - station connue, insensible à la casse", async () => {
      const res = await request(app).get("/last-metro?station=Chatelet");
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("station");
      expect(res.body).toHaveProperty("lastMetro");
      expect(res.body).toHaveProperty("line");
      expect(res.body).toHaveProperty("tz");
    });

    test("404 - station inconnue", async () => {
      const res = await request(app).get("/last-metro?station=Inconnue");
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error");
    });

    test("400 - pas de station", async () => {
      const res = await request(app).get("/last-metro");
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  // /next-metro
  describe("GET /next-metro", () => {
    test("200 - station connue", async () => {
      const res = await request(app).get("/next-metro?station=Chatelet");
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("station");
      expect(res.body).toHaveProperty("line");
      expect(res.body).toHaveProperty("nextArrival");
      expect(res.body.nextArrival).toMatch(/^\d{2}:\d{2}$/); 
    });

    test("400 - pas de station", async () => {
      const res = await request(app).get("/next-metro");
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });
});
