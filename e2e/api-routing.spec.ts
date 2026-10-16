import { expect, test } from "@playwright/test";

const user = {
  id: "routing-fixture",
  email: "routing@example.test",
  name: "Routing Test",
  role: "admin",
};

test("authenticated Operations uses the same first-party backend as session bootstrap", async ({
  page,
  context,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  await context.addCookies([
    { name: "routing_fixture", value: "test", url: origin, httpOnly: true },
  ]);
  const requests: { url: string; cookie: string }[] = [];
  await page.route("**/api/auth/me", async route => {
    requests.push({
      url: route.request().url(),
      cookie: (await route.request().allHeaders()).cookie || "",
    });
    await route.fulfill({ json: { user } });
  });
  await page.route("**/api/operations/shipments", async route => {
    requests.push({
      url: route.request().url(),
      cookie: (await route.request().allHeaders()).cookie || "",
    });
    await route.fulfill({
      json: [
        {
          id: "ORACLE-ROUTING",
          origin: "Harare",
          destination: "Bulawayo",
          status: "In Transit",
        },
      ],
    });
  });
  await page.goto("/#/operations");
  await expect(page.getByText("Connected to live logistics API")).toBeVisible();
  await expect(page.getByText("ORACLE-ROUTING")).toBeVisible();
  expect(requests.map(request => request.url)).toEqual([
    `${origin}/api/auth/me`,
    `${origin}/api/operations/shipments`,
  ]);
  for (const request of requests)
    expect(request.cookie).toContain("routing_fixture=test");
});

test("Oracle proxy failures show the Operations error state without stale demo data", async ({
  page,
}) => {
  await page.route("**/api/auth/me", route =>
    route.fulfill({ json: { user } })
  );
  await page.route("**/api/operations/shipments", route =>
    route.fulfill({ status: 503, json: { error: "Temporarily unavailable" } })
  );
  await page.goto("/#/operations");
  await expect(page.getByText("Logistics API unavailable")).toBeVisible();
  await expect(page.getByText("SHP-8829")).toBeHidden();
});
