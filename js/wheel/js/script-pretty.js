import('https://code.jquery.com/jquery-3.6.0.min.js').then(() => {
    function setAngle(angle)
    {
        $("div.circle").css("transform", "rotate("+angle+"deg)")
        $("a.link").css("transform", "rotate("+(-angle)+"deg)")
    }

    $(function() {
      var currentRotation = 0
      var blocked = false
      var currentActive = $('.link.active')

      $('.link').click(function() {
        if (blocked) {
            return
        }
        blocked = true
        currentActive.removeClass('active')
        currentActive = $(this)
        expectedRotation = parseFloat($(this).attr("data-rotation"))
        const rotationInterval = calculateRotationInterval(currentRotation, expectedRotation)
        const time = Math.abs(rotationInterval.to - rotationInterval.from) * 25/3
        animate(2000, rotationInterval, setAngle).then(function(){
            currentRotation = expectedRotation
            currentActive.addClass('active')
            blocked = false
        })
      });
    });
})

