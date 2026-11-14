# SpeshTV Roku - Moonfin Fork

This beta is based on https://github.com/Moonfin-Client/Roku, not the plain
Jellyfin Roku client. The earlier Jellyfin-based beta is kept in the sibling
speshtv-roku directory. Use this fork for future Roku work.

## Included

### Beta 0.2.15 - HTTPS trailer playback

- Explicit and home-preview trailer ContentNodes now supply Roku's system
  CA bundle for HTTPS media playback, not just for metadata lookup.
- Failures show lookup HTTP/playability status, a Roku decoder error code,
  or startup timeout. No URLs, tokens or raw provider responses are displayed.
- This corrects a missing media HTTPS setting; the cause of the user's TV
  failure remains unconfirmed until device logs or the new error code arrive.

### Beta 0.2.14 - Seerr remote focus and trailer startup

- Discovery handles Left/Right between Search and Requests directly; Up from
  the first poster row reaches Search. The search grid directly handles
  Left/Right between Search and Retry, without relying on StandardButton's
  unused escape field.
- The trailer overlay is attached before lookup begins. Opening OK presses
  are ignored for 750 ms, and a decoder finishing before playback starts no
  longer dismisses the overlay.
- Explicit trailer playback prefers the Android YouTube response's simpler
  muxed MP4 stream before the high-resolution manifest. This can reduce
  trailer resolution to 360p but favors compatibility. A failed startup gets
  one manifest fallback, then a visible error; each startup has a 20-second
  watchdog. Home/background trailer resolution keeps its existing policy.
- A public H.264/AAC stream passed a 1 KB HTTP range test on the PC. This is
  not a Roku playback test. Automated remote-focus and player-state checks
  pass; retest The End of Oak Street and Spider-Man: Brand New Day on the TV.

### Beta 0.2.13 - Seerr search and trailers

- Discovery now has a dedicated Search button and paged movie/show results,
  including requested and available titles. Search and Retry reuse the themed
  grid toolbar; failed pages can be retried without skipping or duplicating them.
- Global search publishes library results first, allows five seconds for the
  optional Seerr response, and shows a warning instead of hiding failures.
- Movie/show detail payloads map Seerr's relatedVideos to supported YouTube
  trailers, with teasers as fallback. Clips, malformed IDs and other sites
  are excluded. Only titles with a supported link offer Trailer.
- Seerr-only trailers bypass Jellyfin's nonexistent local-item lookup and use
  the existing trailer overlay. YouTube extraction/availability can still fail;
  the overlay now displays Trailer Not Available instead of silently closing.
  No server settings change.
- Automated trailer filtering and retry-state checks pass. Remote navigation,
  live Seerr searches and YouTube playback still require testing on the TV.

Beta 0.2.2 adds intersecting country (US/PR/DR/CH), sports-package
(NBA/NFL/MLB/NHL/NCAAB/NCAAF/UFC/PPV), and server-tag filters to the guide
toolbar, plus channel-name/number search and a keyboard channel-number jump.
Search is local to the loaded lineup and makes no per-keystroke API requests.
Loading text now uses the selected theme accent rather than Moonfin's gradient.
This is the first guide-port stage; embedded preview and explicit next/previous
and last-channel controls still need their separate playback-lifecycle work.

- SpeshTV launcher, login, splash and animated loader artwork. The television
  outline matches Android's SpeshTV vector mark. Build assets are generated
  locally at Roku's FHD, HD and SD sizes.
- SpeshTV client identification, settings labels and charcoal/teal defaults.
- Bundled SpeshTV, SpeshFlix, SpeshPrime and SpeshApple themes. Existing saved
  themes remain respected, including server-synced preferences.
- Local-first duplicate removal in Continue Watching, Next Up and the merged
  progress row. No watch history is changed. Preference only applies to
  equivalent items present in these responses, not an entire-library lookup.
- Bounded JSON requests, cancellation on timeout, a corrected discovery port
  reference and clearer server-info timeout handling.
- Smaller 24-channel program batches and limited channel image metadata.
  Moonfin's existing lazy guide, artwork cache and capability-aware native
  playback remain in place. No codec support is falsely advertised.
- Existing Moonfin features and API compatibility, including anime markers,
  themes, Seerr and modern home/detail layouts.

## Build and Install

Run `npm ci`, `npm test`, then `npm run build`.
The ZIP appears at `out/SpeshTV-Moonfin-Roku-0.2.6.zip`.
Upload that ZIP, without extracting it, through Roku's development installer.
It replaces the currently sideloaded development channel. Jellyfin does not
need a restart. See upstream README for developer-mode instructions.

## Verification and Remaining Work

Upstream regression tests, SpeshTV progress/theme tests and the full compiler
build pass. Artwork is visually inspected. No physical Roku has been tested
yet, so connection, remote focus, playback and HDR require device validation.
This is not a claim of complete Android feature parity: plugin fast search,
device-specific recovery and further guide-loading improvements still need
individual Roku implementations and tests.

Version 0.2.3 tints the transparent loading logo using the active theme accent.
Returning from playback reuses a ready guide for up to two minutes, only for
the same server/user and sort setting, with a window that still covers now.
Expired guides follow the existing full-refresh path. This cache is in memory
only and does not suppress scheduled server guide updates.

Version 0.2.4 reads resume ticks from both wrapped content nodes and raw server
records. Resume actions replace the node's default zero starting point with
saved user data; the playback task retains explicit zero for Start Over.
Regression tests cover both shapes, large tick values, and missing positions.
Live channels do not use VOD resume positions. Device playback validation remains.

Version 0.2.5 adds embedded Live TV preview. Selecting a channel starts the
preview; selecting the same channel again or choosing Fullscreen expands the
same Video node without a new playback request. Back returns to preview.
Left from a channel row reaches Fullscreen, with the other toolbar controls
accessible alongside it. Stop, Back from the guide, and leaving the guide
cancel pending loads and stop playback. Selecting another channel reuses
the existing in-place switch with rollback on failure and bounded retries.
This is a device-test build: native video resizing, focus, buffering, and
server session cleanup must be checked on a Roku before claiming parity.

Version 0.2.6 adds Prev/Next/Last guide controls. Prev/Next follow the filtered
lineup and wrap; Last remembers only a successful switch, not a failed attempt.
The preview hero shows the actually playing channel's Now/Next data, reusing
the player's existing programme fetch and checking time boundaries locally.
No extra polling job is added. Returning to preview releases player/OSD focus
and focuses a dedicated guide node. Preview key events bubble to the guide.

Seerr's separate navigation switch now defaults on; a successful manual Seerr
login also reveals its button. Existing saved navigation choices remain in
effect until changed or a new login. For an already signed-in account with
the button hidden, enable Settings > Navigation > Show Seerr Button.
Kids mode still hides Seerr. Credentials, request permissions, and server
configuration are unchanged.

Version 0.2.7 fixes Seerr JSON string escaping and numeric serialization while
preserving camelCase request keys. Invalid title IDs are rejected locally.
Request failures surface server validation reasons, including proxy-wrapped
responses. Regression tests model Roku's native JSON escaping and base64
decoding because the inherited interpreter lacks those built-ins. No real
request was submitted during testing; the reported HD HTTP 400 still needs
a device retry to establish its exact cause.

Version 0.2.8 adds a read-only Language Failover selection lookup before VOD
negotiation, with a 2.5-second deadline and safe fallback when absent. Roku
15.3 lacks secure native WebSockets, so install the accompanying Language
Failover 1.4.0.1 compatibility build and restart Jellyfin before testing.
Automatic choices defer to the server/bridge; manual audio and subtitles-off
choices remain explicit. Reports include the actual media version and track
indices. Native Roku audio IDs are mapped separately from Jellyfin indices.
The bridge reuses upstream language selectors, series overrides and original-
audio/forced-subtitle preferences; it does not change saved configurations.
An upstream Language Failover update may remove the compatibility endpoint.
The server update is not installed by the Roku ZIP. Device playback remains
to be verified with Black Clover and the user's language configuration.

Version 0.2.10 improves automatic series queues. Duplicate season/episode slots
prefer local files while preserving the currently playing item and multi-episode
files. VOD queues can substitute accessible copies from another series entry with
matching provider IDs; conflicting IDs never match. Searches inspect at most eight
series and fetch at most two matching episode lists, with 2.5-second deadlines
per optional request. Missing IDs or failed lookups preserve the original queue.
This does not rewrite explicitly assembled playlists or migrate watch history
between copies. Next/previous actions finalize progress on a separate task before
stopping the player. Jellyfin still decides watched status; existing resume and
autoplay preferences are retained. Tests pass; TV playback verification is pending.

Version 0.2.11 reduces loading work without caching watched/resume data. Seerr grid
cards use their 342px poster URL before the 500px fallback and clear recycled art.
Multi-server season lists request Overview/UserData in the episode-list response,
removing one extra metadata request per episode. Guide programme batches track
pending channel IDs so overlapping favorite/scroll fetches do not duplicate work;
failures release reservations, stale-window responses cannot clear newer requests,
and out-of-order responses cannot rewind the loaded edge. Regression tests cover
these cases. Startup and TV wall-clock speed have not been measured on hardware.

Version 0.2.12 schedules home row jobs with two active jobs maximum. Resume,
Next Up and Continue Listening have priority over optional discovery rows. Later
rows keep non-playable loading placeholders and start fetching within two rows
of focus; library-expanded rows participate individually. Hidden Home pauses new
jobs while existing jobs finish. Returning from another screen requests fresh
progress only, retaining discovery rows until an explicit Home refresh or layout
reload. A refresh requested during a running progress batch runs once afterward.
Unchanged row fingerprints retain existing nodes, including multi-server progress;
progress, artwork and request-status changes still replace the row. Fingerprints
are memory-only and omit the multi-server auth token. Scope changes clear retained
content and rediscover libraries. Initial library discovery and the independent
featured-media/navigation loaders remain outside the two-home-job limit. Unit
tests exercise scheduling and progress invalidation; hardware startup/scrolling
and actual speed gains still require the user's Roku test.

Server plugin endpoints and internal compatibility identifiers retain Moonfin
names intentionally. Original-author support links and attribution remain.
LICENSE remains GPL-2.0. Retain the source and licensing when redistributing.

The inherited Node development/test toolchain reports npm audit advisories,
including one critical advisory in a transitive development dependency.
These dependencies are not included in the Roku ZIP. Do not feed untrusted
archives into the test interpreter. A downgrade was tested but lacked numeric
operations required by Moonfin's regression suite, so the upstream interpreter
was retained rather than weakening the tests. Toolchain remediation remains.
