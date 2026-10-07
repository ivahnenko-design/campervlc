import { createFileRoute, redirect } from "@tanstack/react-router";

// The cancellation terms now live in clause 4 of the rental conditions. Old
// links (emails, bookmarks, search results) keep working through this redirect.
export const Route = createFileRoute("/cancellation-policy")({
  beforeLoad: () => {
    throw redirect({ to: "/condiciones", hash: "cancelacion", statusCode: 301 });
  },
});
