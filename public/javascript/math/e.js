$(function() {
    function fact(num) {
        var rval=1;
        for (var i = 2; i <= num; i++)
            rval = rval * i;
        return rval;
    }

    function run(iterations, callback) {
	var currentIteration = 1;
	var currentEValue = new Decimal(0);
	var one = new Decimal(1);
        Decimal.set({precision: parseInt($('#precision').val())});

        function oneRun() {
            if (currentIteration > iterations) {callback();return;}

	    var base = currentIteration - 1;
	    var number = new Decimal(base * 2 + 2).div(fact(base * 2 + 1));
	    currentEValue = currentEValue.plus(number);

	    $('#currentIterationCount').val(currentIteration);
	    $('#eOutput').val(currentEValue);

            currentIteration++;
            currentID = setTimeout(oneRun, 0);
        };
        oneRun();
    }
    var currentID = 0;
    var isRunning = false;
    $('#run').click(function() {
	if (isRunning) return;
	isRunning = true;
	var iterationCount = $('#iterationCount').val();
	run(iterationCount, function() {isRunning = false;});
    });
    $('#stop').click(function() {
	clearInterval(currentID);
	isRunning = false;
    });
});
