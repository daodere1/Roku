function speshChannelTags(channel as object) as object
    tags = channel.Lookup("Tags")
    if type(tags) = "roArray" or type(tags) = "Array" then return tags
    return []
end function

function speshChannelText(channel as object) as string
    name = channel.Lookup("Name")
    if name = invalid then name = ""
    text = name.ToStr()
    for each tag in speshChannelTags(channel)
        text += " " + tag.ToStr()
    end for
    return LCase(text)
end function

function speshHasChannelLabel(channel as object, label as string) as boolean
    pattern = CreateObject("roRegex", "(^|[^a-z0-9])" + LCase(label) + "([^a-z0-9]|$)", "i")
    return pattern.IsMatch(speshChannelText(channel))
end function

function speshFilterChannels(channels as object, filters as object) as object
    result = []
    for each channel in channels
        matches = true
        if filters.country <> "" and not speshHasChannelLabel(channel, filters.country) then matches = false
        if filters.sports <> "" and not speshHasChannelLabel(channel, filters.sports) then matches = false
        if filters.tag <> ""
            found = false
            for each tag in speshChannelTags(channel)
                if LCase(tag.ToStr()) = LCase(filters.tag) then found = true
            end for
            if not found then matches = false
        end if
        if filters.query <> ""
            number = channel.Lookup("ChannelNumber")
            if number = invalid then number = ""
            text = speshChannelText(channel) + " " + number.ToStr()
            if Instr(1, text, LCase(filters.query)) = 0 then matches = false
        end if
        if matches then result.push(channel)
    end for
    return result
end function
