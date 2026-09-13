# Profile Rich Text

The Profile CMS supports rich formatting for patient-facing profile narrative fields without adding a third-party editor dependency.

## Editor

`components/admin/profile/rich-text-editor.tsx` provides the reusable client-side editor used by `components/admin/profile/profile-form.tsx`.

Supported formatting:
- Paragraphs and Heading 2–4
- Bold, italic, underline and strikethrough
- Bulleted and numbered lists
- Left, center and right alignment
- Text color
- Undo, redo and remove formatting
- Plain-text paste to avoid importing arbitrary external HTML

The editor uses the browser's native editing commands and remains a lightweight presentation-layer component. It does not make API calls itself; the existing profile form autosave continues to own persistence.

## Storage

Rich text is stored as sanitized HTML strings inside the existing `site_settings` documents. No new MongoDB collection or booking infrastructure is introduced.

`lib/cms/rich-text.ts` is the shared normalization boundary. It allowlists formatting elements and safe attributes, restricts links to safe protocols/relative paths, and allows only constrained `color` and `text-align` inline styles. Server-side profile normalization applies this boundary before profile drafts are persisted or returned.

Existing plain-text profile data remains valid. It is normalized without requiring a migration and continues to render correctly.

## Rendering

`components/public/profile/rich-text-content.tsx` is the public rendering boundary. It sanitizes the value again before using `dangerouslySetInnerHTML`, so stored content is never trusted merely because it came from the CMS.

The existing public profile components reuse this renderer for:
- About you
- Therapy approach
- First-session information
- Assessment & evaluation
- Referral requirements
- Accessibility
- Insurance & payment information
- Personal note / why I became a speech-language pathologist

Draft preview uses the same public rendering path, so the therapist previews the same formatting model that patients will see after publishing.

## Compatibility and safety

- Existing API routes remain unchanged.
- Existing draft/autosave/publish workflow remains unchanged.
- MongoDB remains authoritative for persisted CMS settings.
- No new client-to-Mongo or client-to-Google behavior is introduced.
- Rich-text length limits are measured from rendered plain text rather than raw HTML markup.
- Public output is sanitized independently from admin editing, providing defense in depth against malformed or legacy stored markup.
