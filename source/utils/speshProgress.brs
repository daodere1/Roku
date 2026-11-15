function speshNextUpActivityDate(item as object, seriesDates as object) as string
    seriesDate = seriesDates[speshString(item, "SeriesId")]
    if seriesDate <> invalid and seriesDate <> "" then return seriesDate
    if item.UserData <> invalid
        episodeDate = speshString(item.UserData, "LastPlayedDate")
        if episodeDate <> "" then return episodeDate
    end if
    return speshString(item, "DateCreated")
end function

function speshKeepPreferredProgress(items as object, preferredIds as object) as object
    result = []
    for each item in items
        if preferredIds.DoesExist(speshString(item, "Id")) then result.push(item)
    end for
    return result
end function

' A series queue uses season/episode coordinates, not the episode release year.
' Keep the active item so replacing a duplicate cannot strand the queue cursor.
function speshDedupeEpisodeQueue(items as object, currentId as string) as object
    result = []
    positions = {}
    for each item in items
        season = speshString(item, "ParentIndexNumber")
        episode = speshString(item, "IndexNumber")
        if season = "" or episode = ""
            result.Push(item)
        else
            key = season + ":" + episode + ":" + speshString(item, "IndexNumberEnd")
            if positions.DoesExist(key)
                index = positions[key]
                oldId = speshString(result[index], "Id")
                newId = speshString(item, "Id")
                if LCase(newId) = LCase(currentId) or (LCase(oldId) <> LCase(currentId) and speshSourceRank(item) > speshSourceRank(result[index]))
                    result[index] = item
                end if
            else
                positions[key] = result.Count()
                result.Push(item)
            end if
        end if
    end for
    return result
end function

function speshSameSeries(left as object, right as object) as boolean
    matched = false
    if left.ProviderIds <> invalid and right.ProviderIds <> invalid
        for each provider in ["Tvdb", "Tmdb", "Imdb"]
            a = LCase(speshString(left.ProviderIds, provider))
            b = LCase(speshString(right.ProviderIds, provider))
            if a <> "" and b <> ""
                if a <> b then return false
                matched = true
            end if
        end for
    end if
    return matched
end function

' Substitute existing slots only: another library must not change series ordering.
function speshPreferEpisodeCopies(items as object, copies as object, currentId as string) as object
    combined = []
    slots = {}
    for each item in items
        combined.Push(item)
        key = speshEpisodeSlot(item)
        if key <> "" then slots[key] = true
    end for
    for each item in copies
        key = speshEpisodeSlot(item)
        if key <> "" and slots.DoesExist(key) then combined.Push(item)
    end for
    return speshDedupeEpisodeQueue(combined, currentId)
end function

function speshEpisodeSlot(item as object) as string
    season = speshString(item, "ParentIndexNumber")
    episode = speshString(item, "IndexNumber")
    if season = "" or episode = "" then return ""
    return season + ":" + episode + ":" + speshString(item, "IndexNumberEnd")
end function

function speshProgressKey(item as object) as string
    kind = LCase(speshString(item, "Type"))
    if kind = "movie"
        if item.ProviderIds <> invalid
            for each provider in ["Tmdb", "Imdb"]
                id = speshString(item.ProviderIds, provider)
                if id <> "" then return "movie:" + LCase(provider) + ":" + LCase(id)
            end for
        end if
        year = speshString(item, "ProductionYear")
        title = speshProgressTitle(speshString(item, "Name"))
        if year <> "" and title <> "" then return "movie:" + title + ":" + year
    else if kind = "episode"
        title = speshProgressTitle(speshString(item, "SeriesName"))
        season = speshString(item, "ParentIndexNumber")
        episode = speshString(item, "IndexNumber")
        year = speshString(item, "ProductionYear")
        if title <> "" and season <> "" and episode <> ""
            return "episode:" + title + ":" + year + ":" + season + ":" + episode
        end if
    end if
    return "id:" + speshString(item, "Id")
end function

function speshString(item as object, key as string) as string
    value = item.Lookup(key)
    if value = invalid then return ""
    return value.ToStr()
end function

function speshProgressTitle(title as string) as string
    language = CreateObject("roRegex", "\s*\((english|spanish|chinese|japanese|korean)\)\s*$", "i")
    title = language.Replace(title, "")
    punctuation = CreateObject("roRegex", "[^a-z0-9]", "i")
    return LCase(punctuation.ReplaceAll(title, ""))
end function

function speshSourceRank(item as object) as integer
    path = LCase(speshString(item, "Path"))
    if path = "" then return 1
    if path.Left(7) = "http://" or path.Left(8) = "https://" then return 0
    if path.Right(5) = ".strm" then return 0
    return 2
end function

' Preserve server ordering and only replace an equivalent entry with a local file.
function speshDedupeProgress(items as object) as object
    result = []
    positions = {}
    for each item in items
        key = speshProgressKey(item)
        if key = "id:"
            result.Push(item)
        else if positions.DoesExist(key)
            index = positions[key]
            if speshSourceRank(item) > speshSourceRank(result[index]) then result[index] = item
        else
            positions[key] = result.Count()
            result.Push(item)
        end if
    end for
    return result
end function
