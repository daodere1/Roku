sub main()
    channels = [{Id: "one"}, {Id: "two"}, {Id: "three"}]
    check(speshAdjacentChannel(channels, "one", 1).Id = "two", "next channel")
    check(speshAdjacentChannel(channels, "one", -1).Id = "three", "previous wraps")
    check(speshAdjacentChannel(channels, "three", 1).Id = "one", "next wraps")
    check(speshAdjacentChannel([], "one", 1) = invalid, "empty filtered lineup")
    check(speshAdjacentChannel(channels, "missing", 1) = invalid, "current channel outside filter")
    check(speshAdjacentChannel([{Id: "one"}], "one", 1).Id = "one", "single channel")
    past = {Name: "Expired", startSec: 10, endSec: 20}
    current = {Name: "Current", startSec: 20, endSec: 40}
    nextProgram = {Name: "Next", startSec: 40, endSec: 60}
    later = {Name: "Later", startSec: 60, endSec: 80}
    pair = speshProgramPair([later, nextProgram, past, current], 30)
    check(pair.now.Name = "Current" and pair.next.Name = "Next", "unordered now/next")
    pair = speshProgramPair([past, current, nextProgram], 40)
    check(pair.now.Name = "Next", "exact programme boundary")
    pair = speshProgramPair([past, nextProgram], 30)
    check(pair.now = invalid and pair.next.Name = "Next", "gap does not mislabel future programme as now")
    pair = speshProgramPair([past], 30)
    check(pair.now = invalid and pair.next = invalid, "expired guide not advertised")
    pair = speshProgramPair([{}, {startSec: 45, endSec: 44}], 30)
    check(pair.now = invalid and pair.next = invalid, "invalid times")
    print "SPESHTV CHANNEL/NOW NEXT TESTS PASSED"
end sub

sub check(condition as boolean, label as string)
    if not condition
        print "FAIL: " + label
        stop
    end if
end sub
