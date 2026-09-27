import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";

import { createTestFixtures } from "./test-helpers.js";

const fixtures = await createTestFixtures();

describe("createTestFixtures", () => {
  afterAll(async () => {
    await fixtures.cleanup();
  });

  it("binds the app server to the IPv4 loopback address supertest dials", () => {
    expect(fixtures.server.address()).toMatchObject({
      address: "127.0.0.1",
    });
  });

  it("serves the app on that server", async () => {
    const response = await request(fixtures.server).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
