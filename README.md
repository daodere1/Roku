# SpeshTV for Roku

SpeshTV is a customized Roku client for Jellyfin and compatible Emby servers, based on [Moonfin for Roku](https://github.com/Moonfin-Client/Roku) and the [Jellyfin Roku client](https://github.com/jellyfin/jellyfin-roku).

![SpeshTV](images/logo.png)

## SpeshTV features

- SpeshTV icons, splash screens, loading graphics, and the unified Spesh Cinematic theme: cinema black, gold actions, and blue focus.
- Studios chooser with nine streaming-service icons and network discovery.
- Full-color service artwork, translucent navigation, and episode grids focused on the current/resumable episode or first unwatched episode.
- Hold OK on episode cards (or press *) for permitted context actions, with watched/favorite/artwork updates preserving the open season panel. Physical Roku verification of the new episode hold behavior is pending.
- Today & upcoming: a progressive 90-day Eastern-time agenda with independent library, Sonarr, and Radarr sources; explicit EST/EDT air times and honest date-only releases.
- Select a season to browse its episodes in the same detail frame; Back returns to the season picker and preserves your position.
- Live TV guide with channel search, numeric channel entry, country, sports package, and tag filters.
- Hold OK on a channel (or press *) for Watch Full Screen, Preview, and Add/Remove Favorite. Favorites belong to the signed-in Jellyfin user.
- Remote focus protection for search and dialogs, quick Left navigation to upper controls, and restoration of the previous guide channel after using controls.
- Preview/full-screen playback, channel switching, recovery, and an audio-conversion fallback after unsupported live AAC errors.
- Local-first deduplication for Continue Watching and Next Up, refreshed progress, and bounded home loading.
- Seerr discovery and requests, trailer integration, subtitle downloads, resume handling, and compatible language preference integration.

Some features require compatible server plugins. Internal Moonfin API routes and preference identifiers remain intact for compatibility; they are not app branding.

## Build and test

Use Node.js 24 or later:

```sh
npm ci
npm test
npm run build
```

The sideload ZIP is written to `out/`. Enable Developer Mode on your Roku, open its developer installer in a browser, and upload the ZIP. Developer credentials are configured locally and must never be committed.

## Source and support

- [Source](https://github.com/daodere1/Roku)
- [Issues](https://github.com/daodere1/Roku/issues)
- [Privacy policy](PRIVACY_POLICY.md)
- [License](LICENSE)

## Credits

SpeshTV is an independent fork, not an official Moonfin or Jellyfin release. Copyright and license notices from Moonfin, Jellyfin Roku, and other contributors are retained. The project is distributed under GPL-2.0 as provided in LICENSE. Upstream development: https://github.com/Moonfin-Client/Roku.
