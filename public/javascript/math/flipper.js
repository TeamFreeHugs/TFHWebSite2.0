$(function() {
    function getOperator(type, flipSetCount, criteriaValue) {
	switch(type) {
	    case "Equals": return arr => arr.filter(flip => flip.isHead()).length === criteriaValue;
	    case "Not Equals": return arr => arr.filter(flip => flip.isHead()).length !== criteriaValue;
	    case "Larger Than": return arr => arr.filter(flip => flip.isHead()).length > criteriaValue;
	    case "Smaller Than": return arr => arr.filter(flip => flip.isHead()).length < criteriaValue;
            case "Larger | Equals": return arr => arr.filter(flip => flip.isHead()).length >= criteriaValue;
            case "Smaller | Equals": return arr => arr.filter(flip => flip.isHead()).length <= criteriaValue;
        }
    }

    var flipTypes = {
	Coin: function Coin() {
 	    var side = Math.random() > .5;
	    this.isHead = () => side;
	    this.toString = () => this.isHead() ? 'Heads': 'Tails';
	},
	TossSet: function TossSet(numberOfTosses) {
	    var coins = [];
	    for (var toss = 0; toss < numberOfTosses; toss++) {
		coins.push(new flipTypes.Coin());
	    }
	    this.getCoins = () => coins;
	}
    };
    function run(flipCount, flipSetCount, criteriaFunction, callback) {
        var numberOfFlipsPassed = 0;
        var currentFlip = 1;
	
	$('#flipperOutContainer').children().remove();
	for (var x = 0; x < flipSetCount; x++) $('#flipperOutContainer').append($(`<input readonly=true id="flip${x}">`));

        function oneFlip() {
            if ((currentFlip) > flipCount) {callback(numberOfFlipsPassed); return;}
            var toss = new flipTypes.TossSet(flipSetCount);
            var type = toss.getCoins().join(', ');
            $('#currentFlipCount').val(currentFlip);
	    for (var x = 0; x < flipSetCount; x++) $(`#flip${x}`).val(toss.getCoins()[x]);
            if (criteriaFunction(toss.getCoins())) numberOfFlipsPassed++;
	    $('#flipPercentage').val((numberOfFlipsPassed / flipCount) * 100 + "%");
            currentID = setTimeout(oneFlip, 0);
            currentFlip++;
        };
        oneFlip();
    }
    var currentID = 0;
    var isRunning = false
    $('#run').click(function() {
	if (isRunning) return;
	isRunning = true;
        var flipCount = parseInt($('#flipCount').val());
        var flipSetCount = parseInt($('#flipSetCount').val());
        var criteriaValue = parseInt($('#criteriaValue').val());
        var criteriaFunction = getOperator($('#criteriaType').val(), flipSetCount, criteriaValue);
	$('#flipPercentage').val('---%');
        run(flipCount, flipSetCount, criteriaFunction, function(passed) {
	    $('#flipPercentage').val((passed / flipCount) * 100 + "%");
	    isRunning = false;
        });
    });
    $('#stop').click(function() {
	clearTimeout(currentID);
	isRunning = false;
    });
});
