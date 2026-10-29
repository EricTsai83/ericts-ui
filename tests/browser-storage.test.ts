// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";

const key = "ericts-storage-regression";

afterEach(() => {
  window.localStorage?.removeItem(key);
  window.sessionStorage?.removeItem(key);
});

// Node 25+ also defines storage globals. Vitest must expose jsdom's Storage,
// rather than Node's process-wide, file-backed storage, without runtime flags.
it("provides browser localStorage on modern Node without a storage file", () => {
  expect(window.localStorage).toBeInstanceOf(Storage);
  window.localStorage.setItem(key, "local");
  expect(window.localStorage.getItem(key)).toBe("local");
});

it("keeps sessionStorage independent from localStorage", () => {
  expect(window.sessionStorage).toBeInstanceOf(Storage);
  window.sessionStorage.setItem(key, "session");
  expect(window.sessionStorage.getItem(key)).toBe("session");
  expect(window.localStorage.getItem(key)).toBeNull();
});
