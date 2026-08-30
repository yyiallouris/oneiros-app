# contact-email (retired legacy function)

This Postmark-era function is retained only as historical source evidence. It is not deployed and must not be wired to `contact_messages` or used for production support.

Canonical support delivery is [`../support-request`](../support-request/README.md), which serves both signed-in Contact and signed-out Login Support through Resend, keeps the destination server-owned, and persists authenticated requests without weakening client RLS.

Do not deploy `contact-email`.
