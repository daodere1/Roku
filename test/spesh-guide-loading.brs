sub main()
    m.store = {programGeneration: 1, programsInFlight: {}, programsLoaded: {}, programsHighWater: 24}
    missing = storeVisibleMissing([{Id: "PR-3000"}, {Id: "DR-3001"}], 0, 10, 100)
    check(missing.count() = 2 and missing[0] = "PR-3000", "filtered rows fetch independently of full-lineup high water")
    m.store.programsInFlight["PR-3000"] = 1
    m.store.programsRetryAfter = {"DR-3001": 115}
    check(storeVisibleMissing([{Id: "PR-3000"}, {Id: "DR-3001"}], 0, 10, 100).count() = 0, "pending and cooling-down requests cannot stack")
    check(storeVisibleMissing([{Id: "DR-3001"}], 0, 10, 115).count() = 1, "failed visible rows become retryable")
    m.store.programsInFlight = {}
    m.store.programsRetryAfter = {}
    m.sentCount = 0
    ctx = {stopOnStale: true}
    storeSendBatch(["one"], ctx, 48)
    check(m.store.programsInFlight.DoesExist("one"), "reserve before dispatch")
    storeEnsure(["one"])
    check(m.sentCount = 1, "overlapping targeted lookup reuses pending request")
    tag = m.sent.tag
    storeOnBatch({ok: false}, tag)
    check(not m.store.programsInFlight.DoesExist("one"), "failed requests release reservation for retry")
    storeEnsure(["one"])
    check(m.sentCount = 2, "failed lookup can be requested again")
    storeOnBatch({ok: false}, m.sent.tag)
    storeSendBatch(["one"], ctx, 48)
    tag = m.sent.tag
    storeOnBatch({ok: true, ids: ["one"], programs: []}, tag)
    check(m.store.programsHighWater = 48, "successful batch advances edge")
    check(not m.store.programsInFlight.DoesExist("one"), "completed batch releases reservation")
    m.store.programsHighWater = 72
    storeOnBatch({ok: true, ids: ["one"], programs: []}, tag)
    check(m.store.programsHighWater = 72, "out of order response cannot rewind edge")
    storeSendBatch(["one"], ctx, 48)
    storeSendBatch(["one"], ctx, 48)
    storeOnBatch({ok: false}, m.sent.tag)
    check(m.store.programsInFlight.DoesExist("one"), "one response cannot release another pending batch")
    storeOnBatch({ok: false}, m.sent.tag)
    check(not m.store.programsInFlight.DoesExist("one"), "all pending requests released")
    m.store.programGeneration = 2
    m.store.programsInFlight = {one: true}
    storeOnBatch({ok: true, ids: ["one"], programs: []}, tag)
    check(m.store.programsInFlight.DoesExist("one"), "stale response cannot release new window reservation")
    print "SPESHTV GUIDE LOADING TESTS PASSED"
end sub

sub storeSend(request as object)
    m.sent = request
    m.sentCount++
end sub

function storeChannelForId(id as string) as object
    return {Id: id}
end function

sub onStoreChanged()
end sub

function isValid(value as dynamic) as boolean
    return value <> invalid
end function

sub storeContinue(ctx as object, ok = true as boolean)
    m.continued = ok
end sub

sub storeApplyPrograms(ids as object, programs as object)
    m.applied = ids
end sub

sub check(condition as boolean, label as string)
    if not condition
        print "FAIL: " + label
        stop
    end if
end sub
