import { createClient } from "$lib/prismicio";
import { resolveReplyCopy } from "@reddoorla/maintenance/forms/prismic";
import type { RequestEvent } from "@sveltejs/kit";

/**
 * Confirmation-email copy for one submission, read from Prismic on the server.
 *
 * Nothing is taken from the request. The form type is fixed by the action, and
 * the copy is looked up in the client's own CMS — so no text a visitor supplies
 * can reach an outbound email. That matters because the autoresponder mails a
 * submitter-supplied address; submitter-authored body copy would turn the
 * sending domain into a phishing relay.
 *
 * `resolveReplyCopy` swallows CMS errors and answers undefined, the caller then
 * omits `_reply`, and the shared package sends its own per-form-type default. A
 * Prismic error costs a tailored confirmation, never the submission. A Prismic
 * call that HANGS is not bounded here yet (reddoorla/hedloc#88).
 *
 * Returns undefined until the `form_replies` type exists in Hedloc's Prismic
 * (pushed by prismic-models.yml on merge) AND a `form replies` document is
 * published. Ported unchanged from reddoor-starter except these comments.
 */
export async function replyCopyFor(event: RequestEvent, formType: string) {
  const client = createClient({ fetch: event.fetch });
  // Hedloc's `createClient` is untyped JS, so these casts are not needed here
  // today; they are kept so this file stays the starter's, whose typed client
  // has a closed document-type union that `form_replies` may be absent from.
  // Safe because the resolver treats a missing document exactly as it treats an
  // unwritten one: nothing authored, fall back.
  const reader = {
    getSingle: (type: string) => client.getSingle(type as never),
    getByUID: (type: string, uid: string) => client.getByUID(type as never, uid),
  };
  return resolveReplyCopy(reader, { formType });
}
