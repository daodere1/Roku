function speshResumeTicks(item as dynamic) as longinteger
    if item = invalid then return 0&
    data = item.json
    if data = invalid then data = item
    if data.UserData = invalid then return 0&
    ticks = data.UserData.PlaybackPositionTicks
    if ticks = invalid then return 0&
    if ticks <= 0 then return 0&
    return ticks
end function

function speshPlaybackTicks(item as dynamic) as longinteger
    if item = invalid then return 0&
    ' An explicit zero is Start Over, not a missing resume point.
    if item.startingPoint <> invalid
        if item.startingPoint > 0 then return item.startingPoint
        return 0&
    end if
    return speshResumeTicks(item)
end function
