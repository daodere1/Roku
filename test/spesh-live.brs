sub main()
    channels = [
        { Id: "pr", Name: "PR | WAPA", ChannelNumber: "4100", Tags: ["PR", "Local"] },
        { Id: "ncaa", Name: "NCAAF 1", ChannelNumber: "4001", Tags: ["Sports"] },
        { Id: "basketball", Name: "NCAAB 1", ChannelNumber: "4002" },
        { Id: "other", Name: "Prime Channel", ChannelNumber: "100" }
    ]
    filters = { country: "PR", sports: "", tag: "", query: "" }
    check(speshFilterChannels(channels, filters).Count() = 1, "country token does not match Prime")
    filters.country = ""
    filters.sports = "NCAAF"
    check(speshFilterChannels(channels, filters)[0].Id = "ncaa", "college football")
    filters.sports = "NCAAB"
    check(speshFilterChannels(channels, filters)[0].Id = "basketball", "college basketball")
    filters.sports = ""
    filters.tag = "Local"
    check(speshFilterChannels(channels, filters).Count() = 1, "tag filter")
    filters.query = "4001"
    check(speshFilterChannels(channels, filters).Count() = 0, "filters intersect")
    filters.tag = ""
    check(speshFilterChannels(channels, filters)[0].Id = "ncaa", "number search")
    filters.query = "wapa"
    check(speshFilterChannels(channels, filters)[0].Id = "pr", "case insensitive search")
    print "SPESHTV LIVE TESTS PASSED"
end sub

sub check(condition as boolean, label as string)
    if not condition
        print "FAIL: " + label
        stop
    end if
end sub
