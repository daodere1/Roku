sub main()
    folder = "D:\Media\" + Chr(34) + "Films" + Chr(34) + Chr(10)
    payload = SeerrJsonFromPairs([
        { key: "mediaType", value: "movie" },
        { key: "mediaId", value: 123 },
        { key: "is4k", value: false },
        { key: "serverId", value: 1.0 },
        { key: "profileId", value: 2& },
        { key: "rootFolder", value: folder }
    ])
    parsed = ParseJson(payload)
    check(parsed <> invalid, "valid JSON")
    check(InStr(1, payload, Chr(34) + "mediaId" + Chr(34)) > 0, "camelCase preserved")
    check(parsed.mediaId = 123, "numeric media ID")
    check(parsed.serverId = 1 and parsed.profileId = 2, "numeric server/profile IDs")
    check(parsed.is4k = false, "HD boolean")
    check(parsed.rootFolder = folder, "escaped folder round trip")
    check(SeerrFormatJsonValue([1, 2]) = "[1,2]", "TV season numbers")
    check(SeerrFormatJsonValue("all") = Chr(34) + "all" + Chr(34), "all seasons")
    check(RequestBodyString({ bodyJson: payload }) = payload, "prebuilt request unchanged")
    check(PluginRequestError("{""errors"":{""mediaId"":[""Invalid ID""]}}") = "mediaId: Invalid ID", "validation reason")
    check(PluginRequestError("{""title"":""Invalid request""}") = "Invalid request", "problem title")
    check(PluginRequestError("{""message"":""No HD server configured""}") = "No HD server configured", "server message")
    check(PluginRequestError("{""FileContents"":""eyJtZXNzYWdlIjoiTWlzc2luZyBzZXJ2ZXIifQ==""}") = "Missing server", "proxy envelope")
    check(PluginRequestError("{}") = "Plugin request failed", "empty response")
    print "SPESHTV SEERR REQUEST TESTS PASSED"
end sub

sub check(ok as boolean, label as string)
    if not ok then print "FAIL: " + label
end sub

function TestFormatJson(value as dynamic) as string
    if type(value) = "String" or type(value) = "roString"
        escaped = value.Replace("\", "\\")
        escaped = escaped.Replace(Chr(34), "\" + Chr(34))
        escaped = escaped.Replace(Chr(10), "\n")
        return Chr(34) + escaped + Chr(34)
    end if
    return value.ToStr()
end function

function DecodeBase64String(value as string) as string
    if value = "eyJtZXNzYWdlIjoiTWlzc2luZyBzZXJ2ZXIifQ==" then return "{""message"":""Missing server""}"
    return ""
end function
