function speshSeerrTrailers(details as object) as object
    trailers = []
    videos = details.relatedVideos
    if type(videos) <> "roArray" then return trailers
    seen = {}
    ' Prefer trailers over teasers, never clips or arbitrary external URLs.
    for each kind in ["trailer", "teaser"]
        for each video in videos
            key = speshSeerrVideoKey(video, kind)
            if key <> "" and not seen.DoesExist(key)
                seen[key] = true
                trailers.Push({ Url: "https://www.youtube.com/watch?v=" + key })
            end if
        end for
    end for
    return trailers
end function

function speshSeerrVideoKey(video as dynamic, kind as string) as string
    if type(video) <> "roAssociativeArray" then return ""
    if type(video.site) <> "String" and type(video.site) <> "roString" then return ""
    if type(video.type) <> "String" and type(video.type) <> "roString" then return ""
    if LCase(video.site) <> "youtube" or LCase(video.type) <> kind then return ""
    key = video.key
    if type(key) <> "String" and type(key) <> "roString" then return ""
    if Len(key) <> 11 then return ""
    pattern = CreateObject("roRegex", "^[A-Za-z0-9_-]+$", "")
    if not pattern.IsMatch(key) then return ""
    return key
end function
