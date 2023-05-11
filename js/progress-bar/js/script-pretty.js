(function() {
    var setPercent = function(percent)
    {
        $("#bar").css("width", percent + "%")
        $("#percent").text(percent + "%")
    }
    import("https://code.jquery.com/jquery-3.6.0.min.js").then(function() {
        $(function(){
            var interval = null
            $("#start").click(function(){
                if (interval !== null) {
                    clearInterval(interval)
                }
                $("#gif").css("visibility", "hidden")
                var percent = 0
                setPercent(percent)
                interval = setInterval(function(){
                    percent+=3
                    if (percent > 100) {
                        percent = 100
                    }
                    setPercent(percent)
                    if (percent >= 100) {
                        clearInterval(interval)
                        interval = null
                        $("#gif").css("visibility", "visible")
                    }
                }, 100)
            })
            setPercent(0)
        })
    })
})()
