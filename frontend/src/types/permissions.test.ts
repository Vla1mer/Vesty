import { describe, expect, it } from "vitest";
import { ChatPermission, UserRole, isDirectChat, permissionAllows } from "./api";
import type { ChatDto } from "./api";

describe("permissionAllows", () => {
  const cases: Array<[number, number, boolean]> = [
    [ChatPermission.Owner, UserRole.Owner, true],
    [ChatPermission.Owner, UserRole.Admin, false],
    [ChatPermission.Owner, UserRole.User, false],
    [ChatPermission.Admins, UserRole.Owner, true],
    [ChatPermission.Admins, UserRole.Admin, true],
    [ChatPermission.Admins, UserRole.User, false],
    [ChatPermission.Members, UserRole.Owner, true],
    [ChatPermission.Members, UserRole.Admin, true],
    [ChatPermission.Members, UserRole.User, true],
  ];

  it.each(cases)(
    "permission %i with role %i is %s",
    (permission, roleId, expected) => {
      expect(permissionAllows(permission, roleId)).toBe(expected);
    }
  );

  it("denies an unknown permission value", () => {
    expect(permissionAllows(99, UserRole.Owner)).toBe(false);
  });
});

describe("isDirectChat", () => {
  it("follows the isPrivate flag", () => {
    expect(isDirectChat({ isPrivate: true } as ChatDto)).toBe(true);
    expect(isDirectChat({ isPrivate: false } as ChatDto)).toBe(false);
  });
});
