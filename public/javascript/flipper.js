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

    function run(flipCount, flipSetCount, criteriaFunction) {
 	return function() {
	    var numberOfFlipsPassed = 0;
	    for (var currentFlip = 1; currentFlip <= flipCount; currentFlip++) {
		var toss = new flipTypes.TossSet(flipSetCount);
		var type = toss.getCoins().join(', ');
		$('#currentFlipCount').val(currentFlip);
		$('#flip1').val(toss.getCoins()[0]);
		$('#flip2').val(toss.getCoins()[1]);
		$('#flip3').val(toss.getCoins()[2]);
		var numberOfHeads = toss.getCoins().filter(coin => coin.isHead());
	    }
	};
    }

    $('#run').click(function() {
	var flipCount = parseInt($('#flipCount').val());
	var flipSetCount = parseInt($('#flipSetCount').val());
	var criteriaValue = parseInt($('#criteriaValue').val());
	var criteriaFunction = getOperator($('#criteriaType').val(), flipSetCount, criteriaValue);
	setTimeout(run(flipCount, flipSetCount, criteriaFunction), 1000);
    });
});
