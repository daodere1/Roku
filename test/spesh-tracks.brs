sub main()
    source = { DefaultAudioStreamIndex: 4, MediaStreams: [{ Type: "Video", Index: 0 }, { Type: "Audio", Index: 1 }, { Type: "Audio", Index: 4 }] }
    check(speshNegotiatedAudio(source, -1) = 4, "server choice overrides file default")
    check(speshNegotiatedAudio(source, 0) = 0, "explicit stream zero preserved")
    check(speshNegotiatedAudio(source, 1) = 1, "manual choice preserved")
    check(speshNegotiatedAudio({}, -1) = -1, "missing server choice stays automatic")
    source.DefaultAudioStreamIndex = 0
    check(speshNegotiatedAudio(source, -1) = -1, "video stream not selected as audio")
    fields = speshPlaybackTrackFields(4, -1, "source-id")
    check(fields.AudioStreamIndex = 4 and fields.SubtitleStreamIndex = -1, "report audio and subtitles off")
    check(fields.MediaSourceId = "source-id", "report correct version")
    fields = speshPlaybackTrackFields(-1, -2, "")
    check(fields.Count() = 0, "do not report unresolved preferences")
    fields = speshPlaybackTrackFields(0, 0, "")
    check(fields.AudioStreamIndex = 0 and fields.SubtitleStreamIndex = 0, "report zero-index selections")
    check(speshNativeAudioTrack([{ Index: 4, RokuTrackName: "english" }], [{ Name: "english", Track: "2" }], 4) = "2", "map server indices to native track IDs")
    check(speshNativeAudioTrack([], [], 4) = "", "do not hardcode native track")
    response = { ItemId: "episode", MediaSourceId: "version", AudioStreamIndex: 4, SubtitleStreamIndex: -1 }
    selected = speshLanguageSelection(response, "episode", "version", -1, -2)
    check(selected.audio = 4 and selected.subtitle = -1, "apply plugin selection")
    selected = speshLanguageSelection(response, "episode", "version", 1, 6)
    check(selected.audio = 1 and selected.subtitle = 6, "preserve manual choices")
    selected = speshLanguageSelection(response, "another-episode", "version", -1, -2)
    check(selected.audio = -1 and selected.subtitle = -2, "reject wrong episode")
    selected = speshLanguageSelection(response, "episode", "another-version", -1, -2)
    check(selected.audio = -1 and selected.subtitle = -2, "reject wrong media version")
    selected = speshLanguageSelection(invalid, "episode", "version", -1, -2)
    check(selected.audio = -1 and selected.subtitle = -2, "missing endpoint safely falls back")
    response.AudioStreamIndex = "4"
    response.SubtitleStreamIndex = -2
    selected = speshLanguageSelection(response, "episode", "version", -1, -2)
    check(selected.audio = -1 and selected.subtitle = -2, "reject malformed selection")
    print "SPESHTV LANGUAGE TRACK TESTS PASSED"
end sub

sub check(ok as boolean, label as string)
    if not ok then print "FAIL: " + label
end sub
