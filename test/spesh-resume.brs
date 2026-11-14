sub main()
    ticks = 98765432100&
    raw = { UserData: { PlaybackPositionTicks: ticks } }
    wrapped = { json: raw, startingPoint: 0& }
    check(speshResumeTicks(raw) = ticks, "raw server item resume")
    check(speshResumeTicks(wrapped) = ticks, "wrapped item resume ignores node default")
    check(speshPlaybackTicks(raw) = ticks, "raw queue fallback")
    check(speshPlaybackTicks(wrapped) = 0&, "explicit start over wins")
    wrapped.startingPoint = ticks
    check(speshPlaybackTicks(wrapped) = ticks, "explicit resume wins")
    check(speshResumeTicks(invalid) = 0&, "missing item")
    check(speshResumeTicks({}) = 0&, "missing user data")
    check(speshResumeTicks({UserData: {PlaybackPositionTicks: -1}}) = 0&, "negative position")
    print "SPESHTV RESUME TESTS PASSED"
end sub

sub check(condition as boolean, label as string)
    if not condition
        print "FAIL: " + label
        stop
    end if
end sub
