$(function() {

    function run(iterations, callback) {
	var currentIteration = 1;
	var piValue = new Decimal(3);
	var bottom = 2;
        Decimal.set({precision: parseInt($('#precision').val())});

        function oneRun() {
            if (currentIteration > iterations) {callback();return;}
	    piValue = piValue.add(new Decimal(4).div(bottom++ * bottom++ * bottom).times(Math.pow(-1, currentIteration + 1)));

	    $('#currentIterationCount').val(currentIteration);
	    $('#piOutput').val(piValue);

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
