import { describe, expect, it } from "vitest";
import {
  RECOVERY_CODE_COUNT,
  generateRecoveryCodes,
  normalizeRecoveryCode,
} from "@/modules/auth/domain/recovery-codes";

describe("generateRecoveryCodes", () => {
  it("creates 8 different codes without look-alike characters", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(RECOVERY_CODE_COUNT);
    expect(new Set(codes).size).toBe(RECOVERY_CODE_COUNT);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });
});

describe("normalizeRecoveryCode", () => {
  it.each(["abcde-fghjk", "ABCDE FGHJK", " abcdefghjk ", "ABCDE-FGHJK"])(
    "accepts %j",
    (input) => {
      expect(normalizeRecoveryCode(input)).toBe("ABCDE-FGHJK");
    },
  );

  it.each(["", "ABCDE-FGHJ", "ABCDE-FGHJKX", "ABCDE-FGHJ0", "ABCDE_FGHJK"])(
    "rejects %j",
    (input) => {
      expect(normalizeRecoveryCode(input)).toBeNull();
    },
  );
});
