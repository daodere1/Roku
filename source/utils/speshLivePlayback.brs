function speshAdjacentChannel(channels as object, id as string, direction as integer) as dynamic
    if channels.Count() = 0 then return invalid
    for i = 0 to channels.Count() - 1
        if channels[i].Id = id
            target = i + direction
            if target < 0 then target = channels.Count() - 1
            if target >= channels.Count() then target = 0
            return channels[target]
        end if
    end for
    return invalid
end function

function speshProgramPair(programs as object, now as integer) as object
    pair = { now: invalid, next: invalid }
    for each program in programs
        if program.startSec <> invalid and program.endSec <> invalid
            if program.startSec <= now and program.endSec > now
                if pair.now = invalid
                    pair.now = program
                else if program.startSec > pair.now.startSec
                    pair.now = program
                end if
            end if
        end if
    end for
    edge = now
    if pair.now <> invalid then edge = pair.now.endSec
    for each program in programs
        if program.startSec <> invalid and program.endSec <> invalid
            if program.startSec >= edge and program.startSec > now and program.endSec > program.startSec
                if pair.next = invalid
                    pair.next = program
                else if program.startSec < pair.next.startSec
                    pair.next = program
                end if
            end if
        end if
    end for
    return pair
end function
