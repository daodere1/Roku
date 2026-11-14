sub main()
    m.top = { browseType: "search" }
    m.mediaGrid = { content: { getChildCount: function()
        return 20
    end function } }
    m.errorLabel = { visible: true }
    m.isLoading = false
    m.hasMorePages = true
    m.currentPage = 2
    m.calls = 0
    onFilterButtonSelected()
    if m.calls <> 1 or m.currentPage <> 2 then print "FAIL: retry same failed page"
    m.errorLabel.visible = false
    onFilterButtonSelected()
    if m.calls <> 1 then print "FAIL: retry duplicates successful page"
    m.errorLabel.visible = true
    m.isLoading = true
    onFilterButtonSelected()
    if m.calls <> 1 then print "FAIL: retry duplicates active request"
    m.isLoading = false
    m.hasMorePages = false
    onFilterButtonSelected()
    if m.calls <> 1 then print "FAIL: retry beyond last page"
    m.hasMorePages = true
    m.mediaGrid.content.getChildCount = function()
        return 0
    end function
    onFilterButtonSelected()
    if m.calls <> 2 or m.currentPage <> 1 then print "FAIL: retry first empty page"
    print "SPESHTV SEERR SEARCH TESTS PASSED"
end sub

sub LoadContent()
    m.calls = m.calls + 1
end sub

sub ShowFilterDialog()
end sub
