sub main()
    details = { relatedVideos: [
        { site: "YouTube", type: "Teaser", key: "abcdefghijk" },
        { site: "YouTube", type: "Trailer", key: "123456789_-" },
        { site: "YouTube", type: "Trailer", key: "123456789_-" },
        { site: "YouTube", type: "Clip", key: "abcdefghij0" },
        { site: "Vimeo", type: "Trailer", key: "abcdefghij1" },
        { site: "YouTube", type: "Trailer", key: "evil/url123" },
        { site: "YouTube", type: "Trailer", key: "short" },
        { site: "YouTube", type: "Trailer", key: 123 },
        { key: "abcdefghij2" },
        invalid
    ] }
    result = speshSeerrTrailers(details)
    if result.Count() <> 2 then print "FAIL: valid trailers only"
    if result[0].Url <> "https://www.youtube.com/watch?v=123456789_-" then print "FAIL: trailer first"
    if result[1].Url <> "https://www.youtube.com/watch?v=abcdefghijk" then print "FAIL: teaser fallback"
    if speshSeerrTrailers({}).Count() <> 0 then print "FAIL: missing videos"
    if speshSeerrTrailers({ relatedVideos: "bad" }).Count() <> 0 then print "FAIL: malformed videos"
    print "SPESHTV SEERR TRAILER TESTS PASSED"
end sub
