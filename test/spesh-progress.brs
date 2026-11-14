sub main()
    nextEpisode = {SeriesId: "show", DateCreated: "2026-10-12T00:00:00Z", UserData: {LastPlayedDate: "2026-09-01T00:00:00Z"}}
    check(speshNextUpActivityDate(nextEpisode, {show: "2026-10-11T00:00:00Z"}) = "2026-10-11T00:00:00Z", "series viewing activity overrides episode import date and old activity")
    check(speshNextUpActivityDate(nextEpisode, {}) = "2026-09-01T00:00:00Z", "existing viewing activity wins over newer import date")
    nextEpisode.UserData = {}
    check(speshNextUpActivityDate(nextEpisode, {}) = "2026-10-12T00:00:00Z", "import date is fallback only")
    vod = {Id: "vod", Type: "Movie", Name: "Top Gun (Spanish)", ProductionYear: 1986, Path: "/VOD/movie.strm", ProviderIds: {Tmdb: "744"}}
    local = {Id: "local", Type: "Movie", Name: "Top Gun", ProductionYear: 1986, Path: "/Movies/topgun.mkv", ProviderIds: {Tmdb: "744"}}
    result = speshDedupeProgress([vod, local])
    check(result.Count() = 1, "movie dedupe")
    check(result[0].Id = "local", "prefer local regardless of order")
    result = speshDedupeProgress([local, vod])
    check(result[0].Id = "local", "retain local first")
    one = {Id: "one", Type: "Episode", SeriesName: "All Rise (English)", ParentIndexNumber: 1, IndexNumber: 2, ProductionYear: 2019, Path: "/VOD/show.strm"}
    two = {Id: "two", Type: "Episode", SeriesName: "All Rise", ParentIndexNumber: 1, IndexNumber: 2, ProductionYear: 2019, Path: "/Shows/episode.mkv"}
    three = {Id: "three", Type: "Episode", SeriesName: "All Rise", ParentIndexNumber: 2, IndexNumber: 2, ProductionYear: 2019, Path: "/Shows/episode2.mkv"}
    result = speshDedupeProgress([one, two, three])
    check(result.Count() = 2, "different seasons preserved")
    check(result[0].Id = "two", "episode local preference")
    check(speshSourceRank({Path: "https://provider/movie.mkv"}) = 0, "remote URL is not local")
    check(speshDedupeProgress([{Name: "unknown"}, {Name: "unknown"}]).Count() = 2, "missing identity not merged")
    preferred = { local: true }
    result = speshDedupeEpisodeQueue([one, two, three], "one")
    check(result.Count() = 2 and result[0].Id = "one", "keep active VOD episode cursor")
    check(speshDedupeEpisodeQueue([two, one], "one")[0].Id = "one", "active episode wins in either order")
    result = speshPreferEpisodeCopies([one], [two, three], "unrelated")
    check(result.Count() = 1 and result[0].Id = "two", "local copy replaces matching slot without appending another season")
    two.ProductionYear = 2020
    check(speshDedupeEpisodeQueue([one, two], "unrelated").Count() = 1, "episode air year cannot split same episode")
    check(speshDedupeEpisodeQueue([{Id: "a"}, {Id: "b"}], "a").Count() = 2, "unknown episode numbers kept")
    check(speshSameSeries({ProviderIds: {Tvdb: "123"}}, {ProviderIds: {Tvdb: "123"}}), "matching series provider ID")
    check(not speshSameSeries({ProviderIds: {Tvdb: "123", Tmdb: "1"}}, {ProviderIds: {Tvdb: "123", Tmdb: "2"}}), "conflicting series provider IDs rejected")
    check(not speshSameSeries({Name: "Same"}, {Name: "Same"}), "same title alone is insufficient")
    doubleEpisode = {Id: "double", ParentIndexNumber: 1, IndexNumber: 2, IndexNumberEnd: 3, Path: "/Shows/double.mkv"}
    check(speshDedupeEpisodeQueue([one, doubleEpisode], "one").Count() = 2, "multi episode files kept distinct")
    check(speshKeepPreferredProgress([vod, local], preferred).Count() = 1, "Merged rows retain preferred source only")
    print "SPESHTV TESTS PASSED"
end sub

sub check(condition as boolean, label as string)
    if not condition
        print "FAIL: " + label
        stop
    end if
end sub
