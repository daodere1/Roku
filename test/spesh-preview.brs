sub main()
    m.view = {width: 1920, height: 1080, control: "play", position: 123, url: "fixture", setFocus: focusStub}
    m.top = {setFocus: focusStub, findNode: findNodeStub}
    m.numberOverlay = {}
    setSpeshFullscreen(false)
    check(m.view.width = 372 and m.view.height = 209, "preview bounds")
    check(m.view.translation[0] = 35 and m.view.translation[1] = 59, "preview placement")
    check(m.view.speshPreview and not m.speshFullscreen, "preview state")
    setSpeshFullscreen(true)
    check(m.view.width = 1920 and m.view.height = 1080, "fullscreen bounds")
    check(m.view.translation[0] = 0 and m.view.translation[1] = 0, "fullscreen placement")
    check(not m.view.speshPreview and m.speshFullscreen, "fullscreen state")
    setSpeshFullscreen(false)
    check(m.view.control = "play" and m.view.position = 123 and m.view.url = "fixture", "stream retained across transitions")
    m.view = invalid
    setSpeshFullscreen(true)
    check(not m.speshFullscreen, "no player remains safe")
    print "SPESHTV PREVIEW TRANSITION TESTS PASSED"
end sub

sub focusStub(value as boolean)
end sub

function findNodeStub(id as string) as object
    return {setFocus: focusStub}
end function

sub hideToast()
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
