import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as feedGET } from "@/app/api/feed/route";
import { DELETE as postDELETE } from "@/app/api/posts/[postId]/route";
import {
  DELETE as saveDELETE,
  POST as savePOST,
} from "@/app/api/posts/[postId]/save/route";
import { GET as savedGET } from "@/app/api/saved/route";
import { authHeaders, makeRequest, postParams, prepareTestDb } from "./helpers";

let reseed: () => Promise<void>;

beforeAll(async () => {
  ({ reseed } = await prepareTestDb());
});

beforeEach(async () => {
  await reseed();
});

const ada = authHeaders("user_ada", "student");
const linus = authHeaders("user_linus", "student");
const mod = authHeaders("user_mod", "moderator");

describe("authorization boundaries", () => {
  it("401 when unauthenticated", async () => {
    const res = await feedGET(makeRequest("/api/feed?courseId=course_ts101"));
    expect(res.status).toBe(401);
  });

  it("403 when a student saves a post in a course they're not enrolled in", async () => {
    const res = await savePOST(
      makeRequest("/api/posts/post_ts101_1/save", { method: "POST", headers: linus }),
      postParams("post_ts101_1"),
    );
    expect(res.status).toBe(403);
  });

  it("403 when a student reads a feed for a course they're not enrolled in", async () => {
    const res = await feedGET(
      makeRequest("/api/feed?courseId=course_ux301", { headers: ada }),
    );
    expect(res.status).toBe(403);
  });

  it("404 when saving a post that does not exist", async () => {
    const res = await savePOST(
      makeRequest("/api/posts/post_missing/save", { method: "POST", headers: ada }),
      postParams("post_missing"),
    );
    expect(res.status).toBe(404);
  });

  it("404 when the course does not exist", async () => {
    const res = await feedGET(
      makeRequest("/api/feed?courseId=course_missing", { headers: ada }),
    );
    expect(res.status).toBe(404);
  });

  it("the saved list only ever returns the caller's own saves", async () => {
    const res = await savedGET(makeRequest("/api/saved", { headers: ada }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.items).toHaveLength(2);

    expect(body.items.map((p: { id: string }) => p.id)).toEqual([
      "post_ts101_2",
      "post_ts101_1",
    ]);
    expect(body.items.every((p: { hasSaved: boolean }) => p.hasSaved)).toBe(true);

    const shared = body.items.find((p: { id: string }) => p.id === "post_ts101_1");
    expect(shared.savesCount).toBe(2);
  });

  it("students cannot remove posts (moderator-only)", async () => {
    const res = await postDELETE(
      makeRequest("/api/posts/post_ts101_1", { method: "DELETE", headers: ada }),
      postParams("post_ts101_1"),
    );
    expect(res.status).toBe(403);
  });
});

describe("happy path — save / un-save", () => {
  it("saves a post, hydrates flags, and reflects it in the feed", async () => {
    const save = await savePOST(
      makeRequest("/api/posts/post_ts101_3/save", { method: "POST", headers: ada }),
      postParams("post_ts101_3"),
    );
    expect(save.status).toBe(200);
    const saved = await save.json();
    expect(saved).toMatchObject({ postId: "post_ts101_3", hasSaved: true, savesCount: 1 });

    const feed = await feedGET(
      makeRequest("/api/feed?courseId=course_ts101", { headers: ada }),
    );
    const body = await feed.json();
    const post = body.items.find((p: { id: string }) => p.id === "post_ts101_3");
    expect(post.hasSaved).toBe(true);
    expect(post.savesCount).toBe(1);
  });

  it("is idempotent: saving twice does not double-count", async () => {
    await savePOST(
      makeRequest("/api/posts/post_ts101_3/save", { method: "POST", headers: ada }),
      postParams("post_ts101_3"),
    );
    const again = await savePOST(
      makeRequest("/api/posts/post_ts101_3/save", { method: "POST", headers: ada }),
      postParams("post_ts101_3"),
    );
    const body = await again.json();
    expect(body.savesCount).toBe(1);
    expect(body.hasSaved).toBe(true);
  });

  it("un-saves, then re-saves (reactivates) without duplicating", async () => {
    const unsaved = await saveDELETE(
      makeRequest("/api/posts/post_ts101_1/save", { method: "DELETE", headers: ada }),
      postParams("post_ts101_1"),
    );
    const afterUnsave = await unsaved.json();
    expect(afterUnsave.hasSaved).toBe(false);
    expect(afterUnsave.savesCount).toBe(1);

    const resaved = await savePOST(
      makeRequest("/api/posts/post_ts101_1/save", { method: "POST", headers: ada }),
      postParams("post_ts101_1"),
    );
    const afterResave = await resaved.json();
    expect(afterResave.hasSaved).toBe(true);
    expect(afterResave.savesCount).toBe(2);
  });
});

describe("moderator", () => {
  it("can remove a post, which then disappears from the feed", async () => {
    const remove = await postDELETE(
      makeRequest("/api/posts/post_ts101_1", { method: "DELETE", headers: mod }),
      postParams("post_ts101_1"),
    );
    expect(remove.status).toBe(200);

    const feed = await feedGET(
      makeRequest("/api/feed?courseId=course_ts101", { headers: ada }),
    );
    const body = await feed.json();
    expect(body.items.some((p: { id: string }) => p.id === "post_ts101_1")).toBe(false);
  });
});
