import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const output = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', 'source/utils/speshProgress.brs', 'test/spesh-progress.brs'], { encoding: 'utf8' });
assert.ok(output.includes('SPESHTV TESTS PASSED') && !output.includes('FAIL:'), output);
for (const id of ['spesha-style', 'speshflix', 'speshprime', 'speshapple']) {
    const theme = JSON.parse(await readFile(`settings/themes/${id}.json`, 'utf8'));
    assert.equal(theme.id, id);
    for (const key of ['background', 'onBackground', 'surface', 'onSurface', 'scrim', 'accent', 'onAccent', 'inputBorder', 'rangeTrack', 'badgeWatched', 'onBadge']) {
        assert.match(theme.colors[key], /^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
    }
}
process.stdout.write(output + 'SPESHTV THEME TESTS PASSED\n');
const homeDir = await mkdtemp(path.join(tmpdir(), 'spesh-home-'));
try {
    const homeLoading = await readFile('components/home/homeLoading.bs', 'utf8');
    const functions = ['pumpHomeJobs', 'isHomePlaceholderRow', 'homeProgressBusy', 'onHomeFullRefresh'].map(name => {
        const match = homeLoading.match(new RegExp(`^(?:sub|function) ${name}\\([^]*?^end (?:sub|function)`, 'm'));
        assert.ok(match);
        return match[0];
    });
    const fixture = path.join(homeDir, 'home.brs');
    await writeFile(fixture, functions.join('\n\n'));
    const result = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', 'source/utils/speshHomeLoading.brs', fixture, 'test/spesh-home-loading.brs'], {encoding: 'utf8'});
    assert.ok(result.includes('SPESHTV HOME LOADING TESTS PASSED') && !result.includes('FAIL:'), result);
    process.stdout.write(result);
    const homeRows = await readFile('components/home/HomeRows.bs', 'utf8');
    assert.equal((homeRows.match(/control = (?:"RUN"|TaskControl.RUN)/g) || []).length, 1, 'Only initial library discovery bypasses home job queue');
    const updateRow = homeRows.match(/sub addOrUpdateHomeRow\([^]*?end sub/)[0];
    assert.ok(updateRow.indexOf('previousSignature = signature then return') < updateRow.indexOf('replaceChild'));
    assert.ok(homeRows.includes('speshPlaceholder then return'));
    assert.ok(homeRows.includes('if key = KeyCode.UP or key = KeyCode.DOWN then onHomeLoadingFocus()'));
    for (const [callback, key] of [['onMultiServerContinueWatchingComplete', 'resume'], ['onMultiServerNextUpComplete', 'nextup']]) {
        const code = homeRows.match(new RegExp(`sub ${callback}\\([^]*?end sub`))[0];
        assert.ok(code.includes(`addOrUpdateHomeRow(row, sectionName, "${key}")`));
    }
    const home = await readFile('components/home/Home.bs', 'utf8');
    assert.ok(home.includes('if _isReturning\n            m.homeRows.callFunc("refreshProgressRows")') || home.includes('if _isReturning\r\n            m.homeRows.callFunc("refreshProgressRows")'));
    assert.ok(home.includes('callFunc("setHomeVisible", false)'));
} finally {
    await rm(homeDir, {recursive: true, force: true});
}
const live = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', 'source/utils/speshLiveFilters.brs', 'test/spesh-live.brs'], { encoding: 'utf8' });
assert.ok(live.includes('SPESHTV LIVE TESTS PASSED') && !live.includes('FAIL:'), live);
process.stdout.write(live);
const switching = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', 'source/utils/speshLivePlayback.brs', 'test/spesh-live-playback.brs'], { encoding: 'utf8' });
assert.ok(switching.includes('SPESHTV CHANNEL/NOW NEXT TESTS PASSED') && !switching.includes('FAIL:'), switching);
process.stdout.write(switching);
const themePlayer = await readFile('components/ThemeMusicPlayer.bs', 'utf8');
const sectionSettings = JSON.parse(await readFile('settings/settings.json', 'utf8'));
const extrasLoader = await readFile('components/extras/LoadExtrasTask.bs', 'utf8');
for (const section of ['people', 'similar', 'specials']) {
    assert.ok(JSON.stringify(sectionSettings).includes(`ui.itemdetail.sections.${section}`), `Section setting ${section}`);
    assert.ok(extrasLoader.includes(`get_user_setting_bool("ui.itemdetail.sections.${section}", true)`), `Skip hidden section request ${section}`);
}
const progressiveSearch = await readFile('components/search/SearchTask.bs', 'utf8');
assert.ok(progressiveSearch.indexOf('publishSearchResults(normalizeSearchResults({ Items: allItems') < progressiveSearch.indexOf("' Hints are the only route"), 'Publish partial media before all search requests finish');
const homeNavigation = await readFile('components/home/Home.bs', 'utf8');
assert.ok(homeNavigation.includes('focused[1] > 0'), 'Sidebar handoff guards interior row cards');
const rowNavigation = await readFile('components/home/HomeRows.bs', 'utf8');
assert.ok(/if key = KeyCode.LEFT\s+m.top.jumpToRowItem = \[currentRow, targetCol\]\s+return true/.test(rowNavigation), 'Consume left navigation within row');
const audibleTrailer = await readFile('components/details/TrailerOverlay.bs', 'utf8');
assert.ok(audibleTrailer.includes('m.video.mute = false'), 'Explicit trailers must play audio');
assert.ok(!audibleTrailer.includes('ui.home.mediaBarTrailerMuted'), 'Home preview mute must not silence explicit trailers');
const spotlightTask = await readFile('components/home/MediaBarTask.bs', 'utf8');
assert.ok(spotlightTask.includes('remaining = 10000 - deadline.TotalMilliseconds()'), 'Spotlight has one bounded response deadline');
assert.ok(spotlightTask.includes('if not published'), 'Spotlight publishes initial eligible results early');
assert.ok(spotlightTask.includes('running[key].AsyncCancel()'), 'Cancel outstanding spotlight requests');
const spotlightView = await readFile('components/home/MediaBar.bs', 'utf8');
assert.ok(spotlightTask.includes('partial: true'), 'Early spotlight publication is distinguished from completion');
assert.ok(spotlightView.includes('if data.partial <> true then m.newSetTask = invalid'), 'Keep redraw guard until final spotlight results');
assert.ok(spotlightView.includes('if m.mediaBarItems[index].id = previousId then m.currentIndex = index'), 'Final spotlight results preserve the selected title');
assert.match(rowNavigation, /sub reloadLibraries\(\)\s+resetHomeLoading\(\)\s+m.top.content =/, 'Cancel stale row work before clearing library rows');
assert.ok(spotlightView.includes('event.getRoSGNode().isSameNode(m.mediaBarTask)'), 'Ignore replaced spotlight task results');
const settingsOrganizer = await readFile('components/settings/settings.bs', 'utf8');
assert.ok(settingsOrganizer.includes('findSettingsSectionByTitle(configTree, "SpeshTV Settings")'), 'Find branded personalization settings');
const badgeHost = await readFile('components/details/detailMetadataHost.bs', 'utf8');
assert.ok(badgeHost.includes('bg.blendColor = "#202830FF"'), 'Upcoming badge has contrasting dark fill');
const themeInterface = await readFile('components/ThemeMusicPlayer.xml', 'utf8');
const themeTask = await readFile('components/tasks/LoadThemeSongsTask.bs', 'utf8');
assert.ok(themeInterface.includes('<function name="stopMusic" />'), 'Theme stop must be callable by detail hosts');
assert.ok(themePlayer.includes('event.getRoSGNode().isSameNode(m.loadThemeSongsTask)'), 'Ignore stale theme tasks');
assert.ok(themePlayer.includes('unobserveField("themeSongs")'), 'Detach stopped theme requests');
assert.ok(themeTask.includes('InheritFromParent: true'), 'Episodes inherit series themes');
assert.ok(themePlayer.includes('content.streamformat = container'), 'Use actual theme audio format');
const settings = JSON.parse(await readFile('settings/settings.json', 'utf8'));
const seerrTrailers = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', 'source/utils/speshSeerrTrailers.brs', 'test/spesh-seerr-trailers.brs'], { encoding: 'utf8' });
assert.ok(seerrTrailers.includes('SPESHTV SEERR TRAILER TESTS PASSED') && !seerrTrailers.includes('FAIL:'), seerrTrailers);
process.stdout.write(seerrTrailers);
const seerrBrowse = await readFile('components/seerr/SeerrGenreBrowseScreen.bs', 'utf8');
assert.ok(seerrBrowse.includes('endpoint = "/api/v1/search"'));
assert.ok(seerrBrowse.includes('m.currentFilter = "all"'), 'Search includes available/requested titles');
assert.doesNotMatch(seerrBrowse, /^\s*m\.currentFilter = "not_requested"/m, 'Genre browsing cannot hide its whole first page by default');
assert.ok(seerrBrowse.includes('if not event.getRoSGNode().isSameNode(m.apiTask) then return'), 'Discard replaced search responses');
assert.ok(seerrBrowse.includes('if m.errorLabel.visible then return'), 'Failed page cannot be skipped by focus prefetch');
const retrySeerr = seerrBrowse.match(/sub onFilterButtonSelected\([^]*?end sub/)[0];
assert.ok(retrySeerr.includes('LoadContent()') && !retrySeerr.includes('m.currentPage + 1'), 'Retry fetches failed page');
const seerrSearchDir = await mkdtemp(path.join(tmpdir(), 'spesh-seerr-search-'));
try {
    const fixture = path.join(seerrSearchDir, 'retry.brs');
    await writeFile(fixture, retrySeerr);
    const tested = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', fixture, 'test/spesh-seerr-search.brs'], { encoding: 'utf8' });
    assert.ok(tested.includes('SPESHTV SEERR SEARCH TESTS PASSED') && !tested.includes('FAIL:'), tested);
    process.stdout.write(tested);
} finally {
    await rm(seerrSearchDir, { recursive: true, force: true });
}
assert.ok(seerrBrowse.includes('m.currentFocus = "grid"'));
const seerrDetails = await readFile('source/utils/seerrDetailItem.bs', 'utf8');
assert.ok(seerrDetails.includes('RemoteTrailers: speshSeerrTrailers(details)'));
const seerrButtonHost = await readFile('components/details/detailButtonHost.bs', 'utf8');
assert.ok(seerrButtonHost.includes('and config.id <> "trailerButton" then return'));
const trailerActions = await readFile('source/MainActions.bs', 'utf8');
assert.match(trailerActions, /if Left\(trailerItemId, 6\) <> "seerr-"[^]*?GetLocalTrailers/, 'Seerr-only trailers bypass nonexistent Jellyfin items');
const searchCode = await readFile('components/search/SearchTask.bs', 'utf8');
assert.ok(searchCode.indexOf('publishSearchResults(results, query, requestToken, false)') < searchCode.indexOf('appendSeerrResults(results, query)'));
assert.ok(searchCode.includes('SearchSeerrResponse(query, 5000)'));
assert.ok(searchCode.includes('payload.seerrError = results.seerrError ?? ""'));
const trailerOverlay = await readFile('components/details/TrailerOverlay.bs', 'utf8');
assert.ok(trailerOverlay.includes('m.loadingLabel.text = tr("Trailer Not Available")'));
assert.ok(trailerOverlay.includes('content.HttpCertificatesFile = "common:/certs/ca-bundle.crt"'));
assert.ok(trailerOverlay.includes('m.task.cancelRequested = true'));
assert.ok(trailerOverlay.includes('cacheLocally: m.compatibilityFallback'));
const trailerTask = await readFile('components/home/TrailerPreviewTask.bs', 'utf8');
const helperOverlay = await readFile('components/details/TrailerOverlay.bs', 'utf8');
assert.ok(!helperOverlay.includes('m.compatibilityFallback = m.cachedPath.download = true'), 'Cached low-resolution paths must not skip the server helper');
const homeTrailer = await readFile('components/home/mediaBarTrailer.bs', 'utf8');
assert.ok(homeTrailer.includes('serverHelper: true'), 'Home trailers also request the server helper');
assert.ok(trailerTask.includes('server helper source height='), 'Helper resolution is observable without exposing URLs');
assert.ok(trailerTask.includes('size > 33554432'));
assert.ok(trailerTask.includes('if size <= 0 then size = probeTrailerSize(stream)'));
assert.ok(trailerTask.includes('req.AsyncHead()'));
assert.ok(trailerTask.includes('timer.TotalMilliseconds() < 25000'));
assert.ok(trailerTask.includes('downloaded = size'));
assert.ok(trailerTask.includes('req.AsyncCancel()'));
assert.ok(trailerTask.includes('fs.Delete(path)'));
const tracks = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', 'source/utils/speshTrackSelection.brs', 'test/spesh-tracks.brs'], { encoding: 'utf8' });
assert.ok(tracks.includes('SPESHTV LANGUAGE TRACK TESTS PASSED') && !tracks.includes('FAIL:'), tracks);
process.stdout.write(tracks);
function findSetting(value, name) {
    if (!value || typeof value !== 'object') return;
    if (value.settingName === name) return value;
    for (const child of Object.values(value)) {
        const found = findSetting(child, name);
        if (found) return found;
    }
}
assert.equal(findSetting(settings, 'navbar.show_seerr').default, 'true');
const settingsCode = await readFile('components/settings/settings.bs', 'utf8');
const loginHandler = settingsCode.match(/sub HandleSeerrLoginResult\([\s\S]*?end sub/)[0];
assert.ok(loginHandler.indexOf('return') < loginHandler.indexOf('set_user_setting("navbar.show_seerr", "true")'), 'Only successful login reveals Seerr');
for (const file of ['components/Sidebar.bs', 'components/JFOverhang.bs']) {
    const nav = await readFile(file, 'utf8');
    assert.ok(nav.includes('if not kids and seerrEnabled and m.seerrButtonEnabled'), 'Kids restriction and enabled checks retained');
}
process.stdout.write('SPESHTV SEERR NAVIGATION TESTS PASSED\n');
const resume = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', 'source/utils/speshResume.brs', 'test/spesh-resume.brs'], { encoding: 'utf8' });
assert.ok(resume.includes('SPESHTV RESUME TESTS PASSED') && !resume.includes('FAIL:'), resume);
process.stdout.write(resume);
const loader = await readFile('components/loading/LoadingAnimation.bs', 'utf8');
assert.ok(loader.includes('poster.blendColor = themeChrome.Accent()'));
assert.ok(loader.includes('pkg:/images/loading/speshtv-mask.png'));
const guide = await readFile('components/liveTv/guide/LiveTvGuide.bs', 'utf8');
const guideStore = await readFile('components/liveTv/guide/guideStore.bs', 'utf8');
const performanceDir = await mkdtemp(path.join(tmpdir(), 'spesh-loading-'));
try {
    const functions = ['storeSendBatch', 'storeOnBatch', 'storeEnsure', 'storeVisibleMissing'].map(name => {
        const match = guideStore.match(new RegExp(`^(?:sub|function) ${name}\\([^]*?^end (?:sub|function)`, 'm'));
        assert.ok(match, `Missing ${name}`);
        return match[0];
    });
    const fixture = path.join(performanceDir, 'guide.brs');
    const batchSize = guideStore.match(/const STORE_PROGRAM_BATCH = (\d+)/)[1];
    await writeFile(fixture, functions.join('\n\n').replaceAll('STORE_PROGRAM_BATCH', batchSize));
    const result = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', fixture, 'test/spesh-guide-loading.brs'], {encoding: 'utf8'});
    assert.ok(result.includes('SPESHTV GUIDE LOADING TESTS PASSED') && !result.includes('FAIL:'), result);
    process.stdout.write(result);
} finally {
    await rm(performanceDir, {recursive: true, force: true});
}
const ensure = guideStore.match(/sub storeEnsure\([^]*?end sub/)[0];
assert.ok(ensure.includes('not m.store.programsInFlight.DoesExist(id)'));
const apiItems = await readFile('source/api/Items.bs', 'utf8');
const subtitlePlayer = await readFile('components/video/VideoPlayerView.bs', 'utf8');
const subtitleReload = subtitlePlayer.match(/sub reloadWithSubtitle\([^]*?end sub/)[0];
assert.ok(subtitleReload.indexOf('reloadPositionTicks = resumeTicks') < subtitleReload.indexOf('stopForReload()'), 'Subtitle resume captured before player stops');
const stopForReload = subtitlePlayer.match(/sub stopForReload\([^]*?end sub/)[0];
assert.ok(stopForReload.includes('m.top.control = VideoControl.STOP'), 'Reload helper stops playback');
assert.ok(subtitlePlayer.includes('reloadPositionTicks: previous.reloadPositionTicks'), 'Replacement tasks retain the subtitle resume position');
assert.ok(subtitleReload.includes('getCurrentItem'), 'Subtitle changes update active queue item');
const playbackLoader = await readFile('components/ItemGrid/LoadVideoContentTask.bs', 'utf8');
const homeLoader = await readFile('components/home/LoadItemsTask.bs', 'utf8');
const mergedProgress = homeLoader.match(/function loadMergedContinueWatching\([^]*?end function/)[0];
assert.ok(mergedProgress.indexOf('m.top.earlyContent =') < mergedProgress.indexOf('APIRequest("/Shows/NextUp"'), 'Recent progress publishes before Next Up blocks');
assert.ok(mergedProgress.includes('sortServerResultsByDate(early)'), 'Early progress sorts newest first');
assert.ok(mergedProgress.includes('speshDedupeProgress(resumeData.Items)'), 'Early progress keeps local preference');
assert.ok(mergedProgress.includes('EnableResumable: true'), 'Merged Next Up includes in-progress episodes');
assert.ok(mergedProgress.includes('DisableFirstEpisode: true'), 'Progress does not scan recommendations for entirely unwatched shows');
const sdk = await readFile('source/api/sdk.bs', 'utf8');
const views = sdk.match(/function GetUserViews\([^]*?end function/)[0];
assert.ok(views.includes('m.global.session.user.id') && views.includes('cached.scope = scope'), 'Library cache is account-scoped');
assert.ok(views.includes('clock.AsSeconds() < cached.expires') && views.includes('ParseJson(cached.body)'), 'Library cache expires and returns independent data');
assert.ok(mergedProgress.indexOf('sortServerResultsByDate(preview)') < mergedProgress.indexOf('APIRequest("/Items", recentPlayedParams)'), 'Completed-show Next Up entries publish before watch-date enrichment');
assert.ok(mergedProgress.includes('getJsonWithin(APIRequest("/Shows/NextUp", nextUpParams), 60000)'), 'Slow Next Up does not use the shared 20-second timeout');
assert.ok(mergedProgress.includes('item.UserData = userData'), 'Series activity is attached before hidden-item filtering');
const spotlight = await readFile('components/home/MediaBar.bs', 'utf8');
const spotlightLeft = spotlight.split('else if key = KeyCode.LEFT')[1].split('else if key = KeyCode.RIGHT')[0];
assert.ok(spotlightLeft.includes('previousSlide()') && !spotlightLeft.includes('sidebar.setFocus'), 'Spotlight left navigates titles without sidebar interception');
assert.ok(playbackLoader.includes('if trackReload then playbackPosition = m.top.reloadPositionTicks'));
assert.ok(playbackLoader.includes('m.top.reloadPositionTicks = -1&'), 'Position override is single use');
assert.ok(playbackLoader.includes('if playStartSec > 0 and not trackReload'), 'Subtitle change does not apply resume rewind');
const season = apiItems.match(/function TVEpisodesForServer\([^]*?end function/)[0];
assert.ok(!season.includes('ItemMetaDataForServer('), 'Season loading must not make a metadata request for every episode');
assert.ok(season.includes('UserData,Overview') && season.includes('"EnableUserData": true'));
const poster = await readFile('components/seerr/SeerrPoster.bs', 'utf8');
assert.ok(poster.indexOf('m.poster.uri = itemData.sdPosterUrl') < poster.indexOf('m.poster.uri = itemData.hdPosterUrl'));
assert.ok(poster.includes('m.poster.uri = ""'), 'Recycled cards clear stale artwork');
assert.ok(guide.includes('sameScope and sameSort and age >= 0 and age < 120'));
assert.ok(guide.includes('now < m.store.windowEnd'));
assert.ok(guide.includes('m.guideCacheLoadedAt = invalid'));
process.stdout.write('SPESHTV LOADER/CACHE WIRING TESTS PASSED\n');
const fullscreen = guide.match(/sub setSpeshFullscreen\([\s\S]*?end sub/)[0];
const fixtureDir = await mkdtemp(path.join(tmpdir(), 'spesh-preview-'));
try {
    const fixtureFile = path.join(fixtureDir, 'transition.brs');
    await writeFile(fixtureFile, fullscreen);
    const preview = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', fixtureFile, 'test/spesh-preview.brs'], { encoding: 'utf8' });
    assert.ok(preview.includes('SPESHTV PREVIEW TRANSITION TESTS PASSED') && !preview.includes('FAIL:'), preview);
    process.stdout.write(preview);
} finally {
    await rm(fixtureDir, { recursive: true, force: true });
}
assert.ok(fullscreen.includes('m.view.width = 372') && fullscreen.includes('m.view.width = 1920'));
assert.ok(!/CreateObject|CreateVideoPlayerView|control\s*=|playQueue|speshTune/.test(fullscreen), 'Resizing must not create/restart streams');
assert.ok(guide.includes('m.view.callFunc("speshTune", channel)'));
assert.ok(guide.includes('m.view.callFunc("speshStop")'));
assert.match(guide, /sub OnScreenHidden\(\)\s+cancelChannelHold\(\)\s+stopSpeshPreview\(\)/);
const player = await readFile('components/video/VideoPlayerView.bs', 'utf8');
const skip = player.match(/sub handleItemSkipAction\([\s\S]*?end sub/)[0];
assert.equal((skip.match(/ReportPlayback\("stop", true\)/g) || []).length, 2, 'Both next/previous finalize progress before discarding the player');
assert.ok(skip.indexOf('ReportPlayback("stop", true)') < skip.indexOf('unobserveField("state")'));
const episodeTask = await readFile('components/GetNextEpisodeTask.bs', 'utf8');
assert.ok(episodeTask.includes('speshDedupeEpisodeQueue'));
assert.ok(episodeTask.includes('speshSameSeries(series, candidate)'));
assert.ok(episodeTask.includes('if checked >= 2 then exit for'));
const cleanup = player.match(/sub speshStop\([\s\S]*?end sub/)[0];
assert.ok(cleanup.includes('m.LoadMetaDataTask.unobserveField("content")'));
assert.ok(cleanup.includes('abandonLoad()'), 'Stopped preview discards late playback results');
assert.ok(cleanup.includes('abandonLiveRecovery(') && cleanup.includes('releaseLiveSessions()'), 'Stopped preview releases recovery and live sessions');
assert.ok(cleanup.includes('ReportPlayback("stop", true)') && cleanup.includes('m.top.control = VideoControl.STOP'));
assert.ok(player.includes('if m.speshStopped = true then return'));
assert.ok(player.includes('if m.top.speshPreview then return false'), 'Preview keys bubble to guide');
const failedCard = player.match(/sub showLiveFailedCard\([^]*?end sub/)[0];
assert.ok(failedCard.includes('if m.top.speshPreview or m.speshStopped = true then return'), 'Recovery card must not steal preview guide focus');
assert.ok(fullscreen.includes('m.view.setFocus(false)') && fullscreen.includes('m.top.findNode("guideFocus").setFocus(true)'), 'Fullscreen return releases player and focuses guide');
assert.ok(player.includes('m.osd.hasFocus = false'), 'Hidden OSD cannot own focus');
assert.ok(guide.includes('m.view.observeField("speshPlayingChannelId", "updateHero")'));
assert.ok(guide.includes('m.view.observeField("speshNowNext", "updateHero")'));
process.stdout.write('SPESHTV PREVIEW LIFECYCLE WIRING TESTS PASSED\n');
const seerrDir = await mkdtemp(path.join(tmpdir(), 'spesh-seerr-'));
try {
    const functions = [];
    for (const [file, names] of [
        ['source/utils/SeerrUtils.bs', ['SeerrEscapeJsonString', 'SeerrJsonFromPairs', 'SeerrFormatJson', 'SeerrFormatJsonValue', 'isValidStringValue']],
        ['components/seerr/SeerrAPITask.bs', ['RequestBodyString', 'PluginRequestError']]
    ]) {
        const code = await readFile(file, 'utf8');
        for (const name of names) {
            const match = code.match(new RegExp(`^function ${name}\\([^]*?^end function`, 'm'));
            assert.ok(match, `Missing ${name}`);
            functions.push(match[0]);
        }
    }
    const fixture = path.join(seerrDir, 'requests.brs');
    // brs 0.45 lacks native JSON string escaping and ByteArray base64 decoding.
    // The fixture models those Roku built-ins without modifying production code.
    await writeFile(fixture, functions.join('\n\n').replace(/FormatJson\(/g, 'TestFormatJson(').replace(/SeerrTestFormatJson/g, 'SeerrFormatJson'));
    const result = execFileSync(process.execPath, ['node_modules/brs/bin/cli.js', fixture, 'test/spesh-seerr.brs'], { encoding: 'utf8' });
    assert.ok(result.includes('SPESHTV SEERR REQUEST TESTS PASSED') && !result.includes('FAIL:'), result);
    process.stdout.write(result);
} finally {
    await rm(seerrDir, { recursive: true, force: true });
}
