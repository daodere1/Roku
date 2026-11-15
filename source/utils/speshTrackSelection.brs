' -1 means defer audio selection to Jellyfin, not stream zero or the file default.
function speshNegotiatedAudio(source as dynamic, requested as integer) as integer
    if requested >= 0 then return requested
    if type(source) <> "roAssociativeArray" then return -1
    selected = source.DefaultAudioStreamIndex
    if selected = invalid then return -1
    if type(source.MediaStreams) <> "roArray" then return -1
    for each stream in source.MediaStreams
        if LCase(stream.Type) = "audio" and stream.Index = selected then return selected
    end for
    return -1
end function

function speshLanguageSelection(response as dynamic, itemId as string, sourceId as string, audio as integer, subtitle as integer) as object
    result = { audio: audio, subtitle: subtitle }
    if type(response) <> "roAssociativeArray" then return result
    if type(response.ItemId) <> "String" and type(response.ItemId) <> "roString" then return result
    if type(response.MediaSourceId) <> "String" and type(response.MediaSourceId) <> "roString" then return result
    if LCase(response.ItemId.Replace("-", "")) <> LCase(itemId.Replace("-", "")) then return result
    if LCase(response.MediaSourceId) <> LCase(sourceId) then return result
    if audio < 0 and speshIsStreamIndex(response.AudioStreamIndex, 0) then result.audio = response.AudioStreamIndex
    if subtitle = -2 and speshIsStreamIndex(response.SubtitleStreamIndex, -1) then result.subtitle = response.SubtitleStreamIndex
    return result
end function

function speshIsStreamIndex(value as dynamic, minimum as integer) as boolean
    kind = type(value)
    if kind <> "Integer" and kind <> "roInt" and kind <> "roInteger" then return false
    return value >= minimum
end function

' Roku's track IDs need not equal Jellyfin's media stream indices.
function speshNativeAudioTrack(streams as dynamic, available as dynamic, selected as integer) as string
    if type(streams) <> "roArray" or type(available) <> "roArray" then return ""
    for each stream in streams
        if stream.Index = selected
            for each track in available
                if track.Name = stream.RokuTrackName then return track.Track.ToStr()
            end for
        end if
    end for
    return ""
end function

function speshPlaybackTrackFields(audio as integer, subtitle as integer, sourceId as string) as object
    fields = {}
    if audio >= 0 then fields.AudioStreamIndex = audio
    ' -1 is an explicit subtitles-off selection; -2 means not negotiated yet.
    if subtitle >= -1 then fields.SubtitleStreamIndex = subtitle
    if sourceId <> "" then fields.MediaSourceId = sourceId
    return fields
end function
