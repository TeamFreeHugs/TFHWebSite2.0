$(function() {
    function fact(num) {
        var rval=1;
        for (var i = 2; i <= num; i++)
            rval = rval * i;
        return rval;
    }

    function run(iterations, callback) {
	var currentIteration = 1;
	var currentEValue = 0;
        function oneRun() {
            if (currentIteration > iterations) {callback();return;}

	    var base = currentIteration - 1;
	    var number = 1 / fact(base);
	    currentEValue = currentEValue + number;

	    $('#currentIterationCount').val(currentIteration);
	    $('#eOutput').val(currentEValue.toFixed(100));

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
