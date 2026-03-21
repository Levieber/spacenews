import { InternalServerError } from "@infra/errors.js";
import authorization from "@models/authorization.js";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("Without `user`", () => {
      expect(() => authorization.can()).toThrow(InternalServerError);
    });

    test("Without `user.features`", () => {
      const user = {
        username: "UserWithoutFeatures",
      };

      expect(() => authorization.can(user)).toThrow(InternalServerError);
    });

    test("With valid `user`, but without `feature`", () => {
      const user = {
        features: [],
      };

      expect(() => authorization.can(user)).toThrow(InternalServerError);
    });

    test("With valid `user`, but with unknown `feature`", () => {
      const user = {
        features: ["read:user"],
      };

      expect(() => authorization.can(user, "unknown:feature")).toThrow(
        InternalServerError,
      );
    });

    test("With valid `user` and known `feature`", () => {
      const user = {
        features: ["create:user"],
      };

      expect(authorization.can(user, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("Without `user`", () => {
      expect(() => authorization.filterOutput()).toThrow(InternalServerError);
    });

    test("Without `user.features`", () => {
      const user = {
        username: "UserWithoutFeatures",
      };

      expect(() => authorization.filterOutput(user)).toThrow(
        InternalServerError,
      );
    });

    test("With valid `user`, but without `feature`", () => {
      const user = {
        features: [],
      };

      expect(() => authorization.filterOutput(user)).toThrow(
        InternalServerError,
      );
    });

    test("With valid `user`, but with unknown `feature`", () => {
      const user = {
        features: ["read:user"],
      };

      expect(() => authorization.filterOutput(user, "unknown:feature")).toThrow(
        InternalServerError,
      );
    });

    test("With valid `user` and known `feature`, but without `resource`", () => {
      const user = {
        features: [],
      };

      expect(() => authorization.filterOutput(user, "read:user")).toThrow(
        InternalServerError,
      );
    });

    test("With valid `user`, `resource` and known `feature`", () => {
      const user = {
        features: ["read:user"],
      };

      const resource = {
        id: 1,
        username: "ReSource",
        features: ["read:user"],
        email: "resource@resource.com",
        password: "ReSource123!",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-08-02T00:00:00.000Z",
      };

      const output = authorization.filterOutput(user, "read:user", resource);

      expect(output).not.toHaveProperty("password");
      expect(output).not.toHaveProperty("email");
      expect(output).toEqual({
        id: 1,
        username: "ReSource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-08-02T00:00:00.000Z",
      });
    });
  });
});
