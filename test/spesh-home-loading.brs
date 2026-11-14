sub main()
    early = {priority: 1, rowIndex: 0}
    late = {priority: 1, rowIndex: 8}
    progress = {priority: 0, rowIndex: 9}
    check(speshHomeJobIndex([early, progress], [], 0, 2) = 1, "progress first regardless of layout")
    check(speshHomeJobIndex([early], [progress], 0, 2) = 0, "slow progress does not block discovery")
    progress.ready = true
    check(speshHomeJobIndex([early], [progress], 0, 2) = 0, "visible progress releases background loading slot")
    progress.ready = false
    check(speshHomeJobIndex([progress], [early, late], 0, 2) = 0, "progress has a reserved slot")
    check(speshHomeJobIndex([progress], [progress], 0, 2) = -1, "progress requests do not overlap")
    check(speshHomeJobIndex([early], [early, late, progress], 0, 2) = -1, "background concurrency remains bounded")
    check(speshHomeJobIndex([late], [], 0, 2) = 0, "off screen row loads in background")
    check(speshHomeJobIndex([late], [], 6, 2) = 0, "two row lookahead")
    check(speshHomeJobIndex([], [], 0, 2) = -1, "empty queue")
    item = {id: "one", title: "Episode", json: {UserData: {PlaybackPositionTicks: 100}}}
    original = speshHomeItemSignature(item)
    check(original = speshHomeItemSignature(item), "unchanged row fingerprint stable")
    item.json.UserData.PlaybackPositionTicks = 200
    check(original <> speshHomeItemSignature(item), "resume changes invalidate row")
    original = speshHomeItemSignature(item)
    item.json.UserData.Played = true
    check(original <> speshHomeItemSignature(item), "watched changes invalidate row")
    original = speshHomeItemSignature(item)
    item.posterURL = "updated-poster"
    check(original <> speshHomeItemSignature(item), "new artwork invalidates row")
    original = speshHomeItemSignature(item)
    item.json.SeerrMediaInfo = {status: 2}
    check(original <> speshHomeItemSignature(item), "request status invalidates row")
    original = speshHomeItemSignature(item)
    item.json._authToken = "test-only-token"
    check(original = speshHomeItemSignature(item), "credentials excluded from fingerprint")

    rows = []
    for i = 0 to 9
        rows.Push({id: i, isSameNode: sameRow, getChildCount: emptyRow})
    end for
    m.top = {rowItemFocused: [0, 0], content: {children: rows, getChildren: getRows}}
    m.homePending = [jobFor(rows[0], 1), jobFor(rows[8], 1), jobFor(rows[9], 0), jobFor(rows[7], 0)]
    m.homeRunning = []
    m.homeVisible = true
    m.homeAssembling = false
    m.homeRefreshPending = false
    m.refreshed = 0
    pumpHomeJobs()
    check(m.homeRunning.Count() = 3, "pump admits one progress and two background jobs")
    check(m.homeRunning[0].priority = 0 and m.homeRunning[1].priority = 1, "pump starts progress first without starving discovery")
    m.homeRefreshPending = true
    m.homeRunning[0].task.state = "done"
    pumpHomeJobs()
    check(m.homeRunning.Count() = 3 and m.homePending.Count() = 0, "next progress job uses reserved slot")
    check(m.refreshed = 0 and m.homeRefreshPending, "return refresh waits for busy progress job")
    m.homeRunning[2].task.state = "done"
    m.homeVisible = false
    pumpHomeJobs()
    check(m.homeRunning.Count() = 2 and m.homePending.Count() = 0, "hidden home retains running background work")
    m.homeVisible = true
    pumpHomeJobs()
    check(m.refreshed = 1 and not m.homeRefreshPending, "pending progress refresh runs once after current batch")
    check(m.homeRunning.Count() = 2 and m.homePending.Count() = 0, "near and distant rows load after progress")
    m.homeRunning[0].task.state = "done"
    m.top.rowItemFocused = [6, 0]
    pumpHomeJobs()
    check(m.homeRunning.Count() = 1 and m.homePending.Count() = 0, "background row already running before scroll")
    m.fullUpdates = 0
    m.homeFullRefreshClock = {Mark: ignoreMark}
    onHomeFullRefresh()
    check(m.fullUpdates = 0 and m.homeFullRefreshPending, "full refresh defers while rows are loading")
    m.homeRunning = []
    m.homeVisible = false
    onHomeFullRefresh()
    check(m.fullUpdates = 0, "hidden home does not refresh")
    m.homeVisible = true
    pumpHomeJobs()
    check(m.fullUpdates = 1 and not m.homeFullRefreshPending, "deferred all-row refresh runs once when idle")
    print "SPESHTV HOME LOADING TESTS PASSED"
end sub

function jobFor(row as object, priority as integer) as object
    return {row: row, priority: priority, rowIndex: -1, task: {
        state: "run", observeFieldScoped: ignoreObserver, unobserveFieldScoped: ignoreUnobserve, hasField: noField
    }}
end function

function noField(field as string) as boolean
    return false
end function

function isValidAndNotEmpty(value as dynamic) as boolean
    if value = invalid then return false
    return value.Count() > 0
end function

function sameRow(other as object) as boolean
    return m.id = other.id
end function

function emptyRow() as integer
    return 0
end function

function getRows(count as integer, start as integer) as object
    return m.children
end function

sub ignoreObserver(field as string, callback as string)
end sub

sub ignoreUnobserve(field as string)
end sub

sub setRowItemSize()
end sub

sub refreshProgressRows()
    m.refreshed++
end sub

sub updateHomeRows()
    m.fullUpdates++
end sub

sub ignoreMark()
end sub

function isValid(value as dynamic) as boolean
    return value <> invalid
end function

sub check(condition as boolean, label as string)
    if not condition
        print "FAIL: " + label
        stop
    end if
end sub
