$(function() {
    var queryString = location.search.split(/[&?]/).filter(Boolean).map(e=>e.split('=')).reduce((e,d) => {e[d[0]] = d[1]; return e;},{});
    if (queryString.signup === 'true') {
        $('#info').text('Please check your email for a confirmation email before logging in.');
    }
    $('#submit').click(function() {
        var username = $('#fusername').val(),
            password = $('#fpassword').val();
        $('#login-error').css('display', 'block');
        if (username === '') $('#login-error').text('Enter your username');
        else if (password === '') $('#login-error').text('Enter your password');
        else {
            $.ajax({
                method: 'POST',
                url: '/users/login',
                data: {
                    username: username,
                    password: password,
                    csrf: $('#csrf').val()
                }
            }).done(function() {
                $('#username').val(username);
                $('#password').val(password);
                $('#loginbutton').click();
            }).fail(function(data) {
                data = data.responseText;
                data = JSON.parse(data);
                $('#login-error').text(data.message);
            });
        }
    });
    $('#fake-login-form-wrapper > input').keydown(function(event) {
        if(event.keyCode == 13) {
            $('#submit').click();
        }
    });
});
