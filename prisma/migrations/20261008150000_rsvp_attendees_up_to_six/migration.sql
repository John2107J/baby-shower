-- Decision 28: guests choose how many people attend, up to 6 per invitation,
-- regardless of how many names the invitation has (e.g. "Familia Pérez").
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_rsvpAttendeesCount_range";

-- The attendee count must match the answer:
--   no answer yet -> no count; "not attending" -> 0; "attending" -> 1 to 6.
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_rsvp_consistent" CHECK (
  ("rsvpStatus" = 'PENDING' AND "rsvpAttendeesCount" IS NULL)
  OR ("rsvpStatus" = 'NOT_ATTENDING' AND "rsvpAttendeesCount" = 0)
  OR ("rsvpStatus" = 'ATTENDING' AND "rsvpAttendeesCount" BETWEEN 1 AND 6)
);
