function speshHomeJobIndex(pending as object, running as object, focusedRow as integer, limit as integer) as integer
    progressRunning = false
    backgroundRunning = 0
    for each job in running
        if job.priority = 0 then progressRunning = true else backgroundRunning++
    end for
    for i = 0 to pending.Count() - 1
        if pending[i].priority = 0 and not progressRunning then return i
    end for
    if backgroundRunning >= limit then return -1
    for i = 0 to pending.Count() - 1
        if pending[i].priority <> 0 and (pending[i].rowIndex < 0 or pending[i].rowIndex <= focusedRow + 2) then return i
    end for
    for i = 0 to pending.Count() - 1
        if pending[i].priority <> 0 then return i
    end for
    return -1
end function

function speshHomeItemSignature(item as object) as string
    data = item.json
    if data = invalid then data = {}
    snapshot = {}
    snapshot.Append(data)
    snapshot.Delete("_authToken")
    return FormatJson({
        id: item.id, title: item.title, name: item.name, type: item.type,
        poster: item.posterURL, thumbnail: item.thumbnailURL, backdrop: item.backdropURL,
        played: item.PlayedPercentage, data: snapshot
    })
end function
