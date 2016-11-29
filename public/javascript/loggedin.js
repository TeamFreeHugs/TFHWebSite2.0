$(function() {
    $('#logout').click(function() {
        $.ajax({
            method: 'POST',
            url: '/users/logout'
        }).done(function() {
            location.reload();
        });
    });

});

function clearChars(input) {
    return input.replace(/#/g, '').replace(/ /g, '-');
}